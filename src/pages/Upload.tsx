import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Col,
  Divider,
  Input,
  InputNumber,
  notification,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  FundOutlined,
  SettingOutlined,
  CopyOutlined,
  ShareAltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import * as Sentry from '@sentry/browser';
import { INI } from '@speedy-tuner/ini';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { UploadFile } from 'antd/lib/upload/interface';
import { useHistory } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import pako from 'pako';
import {
  customAlphabet,
  nanoid,
} from 'nanoid';
import {
  emailNotVerified,
  restrictedPage,
} from './auth/notifications';
import { useAuth } from '../contexts/AuthContext';
import { Routes } from '../routes';
import {
  fireStoreDoc,
  setDoc,
  getDoc,
  storage,
  storageRef,
  uploadBytesResumable,
  deleteObject,
  db,
} from '../firebase';
import useBrowserStorage from '../hooks/useBrowserStorage';
import TuneParser from '../utils/tune/TuneParser';
import TriggerLogsParser from '../utils/logs/TriggerLogsParser';
import LogParser from '../utils/logs/LogParser';
import { TuneDbData } from '../types/dbData';
import useDb from '../hooks/useDb';

enum MaxFiles {
  TUNE_FILES = 1,
  LOG_FILES = 5,
  TOOTH_LOG_FILES = 5,
  CUSTOM_INI_FILES = 1,
}

type Path = string;

interface UploadedFile {
  [autoUid: string]: Path;
}

interface UploadFileData {
  path: string;
}

interface ValidationResult {
  result: boolean;
  message: string;
}

type ValidateFile = (file: File) => Promise<ValidationResult>;

const containerStyle = {
  padding: 20,
  maxWidth: 600,
  margin: '0 auto',
};

const newTuneIdKey = 'newTuneId';
const maxFileSizeMB = 10;
const descriptionEditorHeight = 260;
const rowProps = { gutter: 10, style: { marginBottom: 10 } };

const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;
const iniIcon = () => <FileTextOutlined />;

const nanoidCustom = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
const baseUploadPath = 'public/users';

const UploadPage = () => {
  const [newTuneId, setNewTuneId] = useState<string>();
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isListed, setIsListed] = useState(true);
  const [tuneFile, setTuneFile] = useState<UploadedFile | null | false>(null);
  const [logFiles, setLogFiles] = useState<UploadedFile>({});
  const [toothLogFiles, setToothLogFiles] = useState<UploadedFile>({});
  const [customIniFile, setCustomIniFile] = useState<UploadedFile | null>(null);
  const hasNavigatorShare = navigator.share !== undefined;
  const { currentUser, refreshToken } = useAuth();
  const history = useHistory();
  const { storageSet, storageGet, storageDelete } = useBrowserStorage();
  const { updateData, getTune } = useDb();

  // details
  const [readme, setReadme] = useState('# My Tune\n\ndescription');
  const [make, setMake] = useState<string>();
  const [model, setModel] = useState<string>();
  const [displacement, setDisplacement] = useState<string>();
  const [year, setYear] = useState<number>();
  const [hp, setHp] = useState<number>();
  const [stockHp, setStockHp] = useState<number>();
  const [engineCode, setEngineCode] = useState<string>();
  const [cylinders, setCylinders] = useState<number>();
  const [aspiration, setAspiration] = useState<string>();
  const [fuel, setFuel] = useState<string>();
  const [injectors, setInjectors] = useState<string>();
  const [coils, setCoils] = useState<string>();

  const noop = () => { };

  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const genericError = (error: Error) => notification.error({ message: 'Error', description: error.message });

  const removeFile = async (path: string) => {
    try {
      return await deleteObject(storageRef(storage, path));
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const publish = async () => {
    setIsLoading(true);
    await updateData(newTuneId!, {
      updatedAt: new Date(),
      isPublished: true,
      isPublic,
      isListed,
      details: {
        readme: readme || null,
        make: make || null,
        model: model || null,
        displacement: displacement || null,
        year: year || null,
        hp: hp || null,
        stockHp: stockHp || null,
        engineCode: engineCode || null,
        cylinders: cylinders || null,
        aspiration: aspiration || null,
        fuel: fuel || null,
        injectors: injectors || null,
        coils: coils || null,
      },
    });
    setIsPublished(true);
    setIsLoading(false);
    storageDelete(newTuneIdKey);
  };

  const validateSize = (file: File) => Promise.resolve({
    result: (file.size / 1024 / 1024) <= maxFileSizeMB,
    message: `File should not be larger than ${maxFileSizeMB}MB!`,
  });

  const upload = async (path: string, options: UploadRequestOption, done: Function, validate: ValidateFile) => {
    const { onError, onSuccess, onProgress, file } = options;

    const validation = await validate(file as File);
    if (!validation.result) {
      const errorName = 'Validation failed';
      const errorMessage = validation.message;
      notification.error({ message: errorName, description: errorMessage });
      onError!({ name: errorName, message: errorMessage });
      return false;
    }

    try {
      const buffer = await (file as File).arrayBuffer();
      const compressed = pako.deflate(new Uint8Array(buffer));
      const uploadTask = uploadBytesResumable(storageRef(storage, path), compressed, {
        customMetadata: {
          name: (file as File).name,
          size: `${(file as File).size}`,
        },
      });

      uploadTask.on(
        'state_changed',
        (snap) => onProgress!({ percent: (snap.bytesTransferred / snap.totalBytes) * 100 }),
        (err) => onError!(err),
        () => {
          onSuccess!(file);
          if (done) done();
        },
      );
    } catch (error) {
      Sentry.captureException(error);
      console.error('Upload error:', error);
      notification.error({ message: 'Upload error', description: (error as Error).message });
      onError!(error as Error);
    }

    return true;
  };

  const tuneFileData = () => ({
    path: `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/${nanoid()}.msq.gz`,
  });

  const logFileData = (file: UploadFile) => {
    const { name } = file;
    const extension = name.split('.').pop();
    return {
      path: `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/logs/${nanoid()}.${extension}.gz`,
    };
  };

  const toothLogFilesData = () => ({
    path: `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/tooth-logs/${nanoid()}.csv.gz`,
  });

  const customIniFileData = () => ({
    path: `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/${nanoid()}.ini.gz`,
  });

  const uploadTune = async (options: UploadRequestOption) => {
    const found = await getTune(newTuneId!);
    if (found) {
      const tuneData: TuneDbData = {
        userUid: currentUser!.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
        isPublic,
        isListed,
        tuneFile: null,
        logFiles: [],
        toothLogFiles: [],
        customIniFile: null,
        details: {},
      };
      await updateData(newTuneId!, tuneData);
    }
    setShareUrl(`${process.env.REACT_APP_WEB_URL}/#/t/${newTuneId}`);

    const { path } = (options.data as unknown as UploadFileData);
    const tune: UploadedFile = {};
    tune[(options.file as UploadFile).uid] = path;
    upload(path, options, () => {
      updateData(newTuneId!, { tuneFile: path });
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        setTuneFile(false);
        return { result, message };
      }

      const valid = (new TuneParser()).parse(await file.arrayBuffer()).isValid();
      if (!valid) {
        setTuneFile(false);
      } else {
        setTuneFile(tune);
      }

      return {
        result: valid,
        message: 'Tune file is not valid!',
      };
    });
  };

  const uploadLogs = async (options: UploadRequestOption) => {
    const { path } = (options.data as unknown as UploadFileData);
    const tune: UploadedFile = {};
    const uuid = (options.file as UploadFile).uid;
    tune[uuid] = path;
    const newValues = { ...logFiles, ...tune };
    upload(path, options, () => {
      updateData(newTuneId!, { logFiles: Object.values(newValues) });
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      let valid = true;
      const extension = file.name.split('.').pop();
      const parser = new LogParser(await file.arrayBuffer());

      switch (extension) {
        case 'mlg':
          valid = parser.isMLG();
          break;
        case 'msl':
        case 'csv':
          valid = parser.isMSL();
          break;
        default:
          valid = false;
          break;
      }

      if (valid) {
        setLogFiles(newValues);
      }

      return {
        result: valid,
        message: 'Log file is empty or not valid!',
      };
    });
  };

  const uploadToothLogs = async (options: UploadRequestOption) => {
    const { path } = (options.data as unknown as UploadFileData);
    const tune: UploadedFile = {};
    tune[(options.file as UploadFile).uid] = path;
    const newValues = { ...toothLogFiles, ...tune };
    upload(path, options, () => {
      updateData(newTuneId!, { toothLogFiles: Object.values(newValues) });
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      const parser = new TriggerLogsParser(await file.arrayBuffer());
      const valid = parser.isComposite() || parser.isTooth();

      if (valid) {
        setToothLogFiles(newValues);
      }

      return {
        result: valid,
        message: 'Tooth logs file is empty or not valid!',
      };
    });
  };

  const uploadCustomIni = async (options: UploadRequestOption) => {
    const { path } = (options.data as unknown as UploadFileData);
    const tune: UploadedFile = {};
    tune[(options.file as UploadFile).uid] = path;
    upload(path, options, () => {
      updateData(newTuneId!, { customIniFile: path });
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      // TODO: change to common interface, add some validation method
      // Create INI parser
      const parser = new INI((new TextDecoder()).decode(await file.arrayBuffer()));
      const valid = parser.parse().megaTune.signature.length > 0;

      if (valid) {
        setCustomIniFile(tune);
      }

      return {
        result: valid,
        message: 'INI file is empty or not valid!',
      };
    });
  };

  const removeTuneFile = async (file: UploadFile) => {
    if (tuneFile) {
      removeFile(tuneFile[file.uid]);
    }
    setTuneFile(null);
    updateData(newTuneId!, { tuneFile: null });
  };

  const removeLogFile = async (file: UploadFile) => {
    const { uid } = file;
    if (logFiles[file.uid]) {
      removeFile(logFiles[file.uid]);
    }
    const newValues = { ...logFiles };
    delete newValues[uid];
    setLogFiles(newValues);
    updateData(newTuneId!, { logFiles: Object.values(newValues) });
  };

  const removeToothLogFile = async (file: UploadFile) => {
    const { uid } = file;
    if (toothLogFiles[file.uid]) {
      removeFile(toothLogFiles[file.uid]);
    }
    const newValues = { ...toothLogFiles };
    delete newValues[uid];
    setToothLogFiles(newValues);
    updateData(newTuneId!, { toothLogFiles: Object.values(newValues) });
  };

  const removeCustomIniFile = async (file: UploadFile) => {
    if (customIniFile) {
      removeFile(customIniFile![file.uid]);
    }
    setCustomIniFile(null);
    updateData(newTuneId!, { customIniFile: null });
  };

  const prepareData = useCallback(async () => {
    if (!currentUser) {
      restrictedPage();
      history.push(Routes.LOGIN);

      return;
    }

    try {
      await refreshToken();
      if (!currentUser.emailVerified) {
        emailNotVerified();
        history.push(Routes.LOGIN);

        return;
      }
      setIsUserAuthorized(true);
    } catch (error) {
      Sentry.captureException(error);
      storageDelete(newTuneIdKey);
      console.error(error);
      genericError(error as Error);
    }

    let newTuneIdTemp = await storageGet(newTuneIdKey);
    if (!newTuneIdTemp) {
      newTuneIdTemp = nanoidCustom();
      await storageSet(newTuneIdKey, newTuneIdTemp);
    }
    setNewTuneId(newTuneIdTemp);
  }, [currentUser, history, refreshToken, storageDelete, storageGet, storageSet]);

  useEffect(() => {
    prepareData();
  }, [currentUser, history, prepareData, refreshToken]);

  const uploadButton = (
    <Space direction="vertical">
      <PlusOutlined />Upload
    </Space>
  );

  const shareSection = (
    <>
      <Divider>Publish & Share</Divider>
      {isPublished && <Row>
        <Input
          style={{ width: `calc(100% - ${hasNavigatorShare ? 65 : 35}px)` }}
          value={shareUrl!}
        />
        <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
          <Button icon={<CopyOutlined />} onClick={copyToClipboard} />
        </Tooltip>
        {hasNavigatorShare && (
          <Tooltip title="Share">
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => navigator.share({ url: shareUrl! })}
            />
          </Tooltip>
        )}
      </Row>}
      <Row style={{ marginTop: 10 }}>
        {!isPublished ? <Button
          type="primary"
          block
          disabled={isLoading}
          onClick={publish}
        >
          Publish
        </Button> : <Button
          type="primary"
          block
          onClick={() => {
            window.location.href = shareUrl as string;
          }}
        >
          Open
        </Button>}
      </Row>
    </>
  );

  const detailsSection = (
    <>
      <Divider>
        <Space>
          Upload Custom INI
          <Typography.Text type="secondary">(.ini)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        customRequest={uploadCustomIni}
        data={customIniFileData}
        onRemove={removeCustomIniFile}
        iconRender={iniIcon}
        disabled={isPublished}
        onPreview={noop}
        accept=".ini"
      >
        {!customIniFile && uploadButton}
      </Upload>
      <Divider>
        <Space>
          README
          <Typography.Text type="secondary">(markdown)</Typography.Text>
        </Space>
      </Divider>
      <Tabs defaultActiveKey="source" className="upload-readme">
        <Tabs.TabPane tab="Edit" key="source" style={{ height: descriptionEditorHeight }}>
          <Input.TextArea
            rows={10}
            showCount
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            maxLength={3_000}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Preview" key="preview" style={{ height: descriptionEditorHeight }}>
          <div className="markdown-preview" style={{ height: '100%' }}>
            <ReactMarkdown>
              {readme}
            </ReactMarkdown>
          </div>
        </Tabs.TabPane>
      </Tabs>
      <Divider>
        <Space>Details</Space>
      </Divider>
      <Row {...rowProps}>
        <Col span={12}>
          <Input addonBefore="Make" value={make} onChange={(e) => setMake(e.target.value)} />
        </Col>
        <Col span={12}>
          <Input addonBefore="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={12}>
          <InputNumber addonBefore="Year" value={year} onChange={setYear} style={{ width: '100%' }} min={1886} />
        </Col>
        <Col span={12}>
          <Input addonBefore="Displacement" addonAfter="l" value={displacement} onChange={(e) => setDisplacement(e.target.value)} />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={12}>
          <InputNumber addonBefore="HP" value={hp} onChange={setHp} style={{ width: '100%' }} min={0} />
        </Col>
        <Col span={12}>
          <InputNumber addonBefore="Stock HP" value={stockHp} onChange={setStockHp} style={{ width: '100%' }} min={0} />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={12}>
          <Input addonBefore="Engine code" value={engineCode} onChange={(e) => setEngineCode(e.target.value)} />
        </Col>
        <Col span={12}>
          <InputNumber addonBefore="No of cylinders" value={cylinders} onChange={setCylinders} style={{ width: '100%' }} min={0} />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={12}>
          <Select placeholder="Aspiration" value={aspiration} onChange={setAspiration} style={{ width: '100%' }}>
            <Select.Option value="NA">Naturally aspirated</Select.Option>
            <Select.Option value="turbo">Turbo</Select.Option>
            <Select.Option value="compressor">Compressor</Select.Option>
          </Select>
        </Col>
        <Col span={12}>
          <Input addonBefore="Fuel type" value={fuel} onChange={(e) => setFuel(e.target.value)} />
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col span={12}>
          <Input addonBefore="Injectors" value={injectors} onChange={(e) => setInjectors(e.target.value)} />
        </Col>
        <Col span={12}>
          <Input addonBefore="Coils" value={coils} onChange={(e) => setCoils(e.target.value)} />
        </Col>
      </Row>
      <Divider>
        Visibility
      </Divider>
      <Space direction="vertical" size="large">
        <Space>
          Public:<Switch disabled checked={isPublic} onChange={setIsPublic} />
        </Space>
        <Space>
          Listed:<Switch checked={isListed} onChange={setIsListed} />
        </Space>
      </Space>
    </>
  );

  const optionalSection = (
    <>
      <Divider>
        <Space>
          Upload Logs
          <Typography.Text type="secondary">(.mlg, .csv, .msl)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        customRequest={uploadLogs}
        data={logFileData}
        onRemove={removeLogFile}
        iconRender={logIcon}
        multiple
        maxCount={MaxFiles.LOG_FILES}
        disabled={isPublished}
        onPreview={noop}
        accept=".mlg,.csv,.msl"
      >
        {Object.keys(logFiles).length < MaxFiles.LOG_FILES && uploadButton}
      </Upload>
      <Divider>
        <Space>
          Upload Tooth and Composite logs
          <Typography.Text type="secondary">(.csv)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        customRequest={uploadToothLogs}
        data={toothLogFilesData}
        onRemove={removeToothLogFile}
        iconRender={toothLogIcon}
        multiple
        maxCount={MaxFiles.TOOTH_LOG_FILES}
        onPreview={noop}
        accept=".csv"
      >
        {Object.keys(toothLogFiles).length < MaxFiles.TOOTH_LOG_FILES && uploadButton}
      </Upload>
      <Space style={{ marginTop: 30 }}>
        Show details:
        <Switch checked={showDetails} onChange={setShowDetails} />
      </Space>
      {showDetails && detailsSection}
      {shareUrl && tuneFile && shareSection}
    </>
  );

  if (!isUserAuthorized) {
    return (
      <div style={containerStyle}>
        <Skeleton active />
      </div>
    );
  }

  if (isPublished) {
    return (
      <div style={containerStyle}>
        {shareSection}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Divider>
        <Space>
          Upload Tune
          <Typography.Text type="secondary">(.msq)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        customRequest={uploadTune}
        data={tuneFileData}
        onRemove={removeTuneFile}
        iconRender={tuneIcon}
        disabled={isPublished}
        onPreview={noop}
        accept=".msq"
      >
        {tuneFile === null && uploadButton}
      </Upload>
      {tuneFile && optionalSection}
    </div>
  );
};

export default UploadPage;
