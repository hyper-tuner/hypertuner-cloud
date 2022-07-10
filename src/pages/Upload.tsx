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
  Space,
  Switch,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  Form,
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
import { INI } from '@hyper-tuner/ini';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { UploadFile } from 'antd/lib/upload/interface';
import {
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { nanoid } from 'nanoid';
import {
  emailNotVerified,
  restrictedPage,
} from './auth/notifications';
import { useAuth } from '../contexts/AuthContext';
import { Routes } from '../routes';
import TuneParser from '../utils/tune/TuneParser';
import TriggerLogsParser from '../utils/logs/TriggerLogsParser';
import LogParser from '../utils/logs/LogParser';
import useDb from '../hooks/useDb';
import useServerStorage, { ServerFile } from '../hooks/useServerStorage';
import { buildFullUrl } from '../utils/url';
import Loader from '../components/Loader';

const { Item } = Form;

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
type UploadDone = (fileCreated: ServerFile, file: File) => void;

const rowProps = { gutter: 10 };
const colProps = { span: 24, sm: 12 };

const maxFileSizeMB = 50;
const descriptionEditorHeight = 260;
const thisYear = (new Date()).getFullYear();
const generateTuneId = () => nanoid(10);

const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;
const iniIcon = () => <FileTextOutlined />;

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });

const UploadPage = () => {
  const routeMatch = useMatch(Routes.UPLOAD_WITH_TUNE_ID);
  const [newTuneId, setNewTuneId] = useState<string>();
  const [tuneDocumentId, setTuneDocumentId] = useState<string>();
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [tuneFile, setTuneFile] = useState<UploadedFile | null | false>(null);
  const [logFiles, setLogFiles] = useState<UploadedFile>({});
  const [toothLogFiles, setToothLogFiles] = useState<UploadedFile>({});
  const [customIniFile, setCustomIniFile] = useState<UploadedFile | null>(null);
  const hasNavigatorShare = navigator.share !== undefined;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { removeFile, uploadFile, basePathForFile } = useServerStorage();
  const { createTune, getBucketId, updateTune } = useDb();
  const requiredRules = [{ required: true, message: 'This field is required!' }];
  const [readme, setReadme] = useState('# My Tune\n\ndescription');

  const noop = () => { };

  const goToNewTune = () => navigate(generatePath(Routes.TUNE_ROOT, {
    tuneId: newTuneId!,
  }));

  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const genericError = (error: Error) => notification.error({ message: 'Error', description: error.message });

  const publish = async (values: any) => {
    setIsLoading(true);
    // await updateTune(tuneDocumentId!, {
    //   tuneId: newTuneId!,
    //   userId: currentUser!.$id,
    //   updatedAt: Date.now(),
    //   isPublished: true,
    //   isListed: values.isListed,
    //   readme,
    //   make: values.make,
    //   model: values.model,
    //   displacement: values.displacement,
    //   year: values.year,
    //   hp: values.hp || null,
    //   stockHp: values.stockHp || null,
    //   engineCode: values.engineCode || null,
    //   cylindersCount: values.cylindersCount || null,
    //   aspiration: values.aspiration || null,
    //   fuel: values.fuel || null,
    //   injectorsSize: values.injectorsSize || null,
    //   coils: values.coils || null,
    setIsLoading(false);
    setIsPublished(true);
  };

  const validateSize = (file: File) => Promise.resolve({
    result: (file.size / 1024 / 1024) <= maxFileSizeMB,
    message: `File should not be larger than ${maxFileSizeMB}MB!`,
  });

  const upload = async (userId: string, options: UploadRequestOption, done: UploadDone, validate: ValidateFile) => {
    const { onError, onSuccess, file } = options;

    const validation = await validate(file as File);
    if (!validation.result) {
      const errorName = 'Validation failed';
      const errorMessage = validation.message;
      notification.error({ message: errorName, description: errorMessage });
      onError!({ name: errorName, message: errorMessage });

      return false;
    }

    try {
      const pako = await import('pako');
      const buffer = await (file as File).arrayBuffer();
      const compressed = pako.deflate(new Uint8Array(buffer));
      const bucketId = await getBucketId(userId);
      const fileCreated: ServerFile = await uploadFile(userId, bucketId, new File([compressed], (file as File).name));

      done(fileCreated, file as File);
      onSuccess!(null);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Upload error:', error);
      notification.error({ message: 'Upload error', description: (error as Error).message });
      onError!(error as Error);

      return false;
    }

    return true;
  };

  const tuneFileData = () => ({
    path: basePathForFile(currentUser!.$id, newTuneId!, `tune/${nanoid()}.msq.gz`),
  });

  const logFileData = (file: UploadFile) => {
    const { name } = file;
    const extension = name.split('.').pop();
    return {
      path: basePathForFile(currentUser!.$id, newTuneId!, `logs/${nanoid()}.${extension}.gz`),
    };
  };

  const toothLogFilesData = () => ({
    path: basePathForFile(currentUser!.$id, newTuneId!, `tooth-logs/${nanoid()}.csv.gz`),
  });

  const customIniFileData = () => ({
    path: basePathForFile(currentUser!.$id, newTuneId!, `ini/${nanoid()}.ini.gz`),
  });

  const uploadTune = async (options: UploadRequestOption) => {
    setShareUrl(buildFullUrl([tunePath(newTuneId!)]));

    upload(currentUser!.$id, options, async (fileCreated: ServerFile, file: File) => {
      const tune: UploadedFile = {};
      tune[(options.file as UploadFile).uid] = fileCreated.$id;
      setTuneFile(tune);
      const parsedTune = (new TuneParser()).parse(await file.arrayBuffer()).getTune();
      const document = await createTune({
        userId: currentUser!.$id,
        tuneId: newTuneId!,
        signature: parsedTune.details.signature,
        isPublished: false,
        isListed: true,
        tuneFileId: fileCreated.$id,
        vehicleName: '',
        displacement: 0,
        cylindersCount: 0,
        engineMake: '',
        engineCode: '',
        aspiration: 'na',
        readme: '',
      });
      setTuneDocumentId(document.$id);
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      return {
        result: (new TuneParser()).parse(await file.arrayBuffer()).isValid(),
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
      // updateTune(tuneDocumentId!, { logFileIds: Object.values(newValues) });
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
      // updateTune(tuneDocumentId!, { toothLogFileIds: Object.values(newValues) });
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
      // updateTune(tuneDocumentId!, { customIniFileId: path });
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      let validationMessage = 'INI file is empty or not valid!';
      let valid = false;
      try {
        const parser = new INI(await file.arrayBuffer()).parse();
        valid = parser.getResults().megaTune.signature.length > 0;
      } catch (error) {
        valid = false;
        validationMessage = (error as Error).message;
      }

      if (valid) {
        setCustomIniFile(tune);
      }

      return {
        result: valid,
        message: validationMessage,
      };
    });
  };

  const removeTuneFile = async (file: UploadFile) => {
    if (tuneFile) {
      removeFile(await getBucketId(currentUser!.$id), tuneFile[file.uid]);
    }
    setTuneFile(null);
    updateTune(tuneDocumentId!, { tuneFileId: '' });
  };

  const removeLogFile = async (file: UploadFile) => {
    const { uid } = file;
    if (logFiles[file.uid]) {
      // removeFile(logFiles[file.uid]);
    }
    const newValues = { ...logFiles };
    delete newValues[uid];
    setLogFiles(newValues);
    // updateTune(tuneDocumentId!, { logFiles: Object.values(newValues) });
  };

  const removeToothLogFile = async (file: UploadFile) => {
    const { uid } = file;
    if (toothLogFiles[file.uid]) {
      // removeFile(toothLogFiles[file.uid]);
    }
    const newValues = { ...toothLogFiles };
    delete newValues[uid];
    setToothLogFiles(newValues);
    // updateTune(tuneDocumentId!, { toothLogFiles: Object.values(newValues) });
  };

  const removeCustomIniFile = async (file: UploadFile) => {
    if (customIniFile) {
      // removeFile(customIniFile![file.uid]);
    }
    setCustomIniFile(null);
    // updateTune(tuneDocumentId!, { customIniFile: null });
  };

  const prepareData = useCallback(async () => {
    if (!currentUser) {
      restrictedPage();
      navigate(Routes.LOGIN);

      return;
    }

    try {
      if (!currentUser.emailVerification) {
        emailNotVerified();
        navigate(Routes.LOGIN);

        return;
      }
      setIsUserAuthorized(true);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      genericError(error as Error);
    }

    const currentTuneId = routeMatch?.params.tuneId;
    if (currentTuneId) {
      // TODO: handle update later when reusing tuneId
      setNewTuneId(currentTuneId);
      console.info('Using tuneId:', currentTuneId);
    } else {
      navigate(generatePath(Routes.UPLOAD_WITH_TUNE_ID, {
        tuneId: generateTuneId(),
      }), { replace: true });
    }
  }, [currentUser, navigate, routeMatch?.params.tuneId]);

  useEffect(() => {
    prepareData();
  }, [currentUser, prepareData]);

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
        <Item style={{ width: '100%' }}>
          {!isPublished ? <Button
            type="primary"
            block
            loading={isLoading}
            htmlType="submit"
          >
            Publish
          </Button> : <Button
            type="primary"
            block
            onClick={goToNewTune}
          >
            Open
          </Button>}
        </Item>
      </Row>
    </>
  );

  const detailsSection = (
    <>
      <Divider>
        <Space>Details</Space>
      </Divider>
      <Row {...rowProps}>
        <Col span={24} sm={24}>
          <Item name="vehicleName" rules={requiredRules}>
            <Input addonBefore="Vehicle name" />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="engineMake" rules={requiredRules}>
            <Input addonBefore="Engine make" />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="engineCode" rules={requiredRules}>
            <Input addonBefore="Engine code" />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="displacement" rules={requiredRules}>
            <InputNumber addonBefore="Displacement" addonAfter="L" min={0} max={100} />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="cylindersCount">
            <InputNumber addonBefore="No of cylinders" style={{ width: '100%' }} min={0} max={16} />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="compression">
            <InputNumber addonBefore="Compression" style={{ width: '100%' }} min={0} max={1000} step={0.1} addonAfter=":1" />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="aspiration">
            <Select placeholder="Aspiration" style={{ width: '100%' }}>
              <Select.Option value="na">Naturally aspirated</Select.Option>
              <Select.Option value="turbocharger">Turbocharged</Select.Option>
              <Select.Option value="supercharger">Supercharged</Select.Option>
            </Select>
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="fuel">
            <Input addonBefore="Fuel" />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="ignition">
            <Input addonBefore="Ignition" />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="injectorsSize">
            <InputNumber addonBefore="Injectors size" addonAfter="cc" min={0} max={100_000} />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="year" rules={requiredRules}>
            <InputNumber addonBefore="Year" style={{ width: '100%' }} min={1886} max={thisYear} />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="hp">
            <InputNumber addonBefore="HP" style={{ width: '100%' }} min={0} max={100_000} />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="stockHp">
            <InputNumber addonBefore="Stock HP" style={{ width: '100%' }} min={0} max={100_000} />
          </Item>
        </Col>
      </Row>
      <Divider style={{ marginTop: 40 }}>
        <Space>
          README
          <Typography.Text type="secondary">(markdown)</Typography.Text>
        </Space>
      </Divider>
      <Tabs defaultActiveKey="source" className="upload-readme">
        <Tabs.TabPane tab="Edit" key="source" style={{ height: descriptionEditorHeight }}>
          <Item name="readme">
            <Input.TextArea
              rows={10}
              showCount
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              maxLength={3_000}
            />
          </Item>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Preview" key="preview" style={{ height: descriptionEditorHeight }}>
          <div className="markdown-preview">
            <ReactMarkdown>
              {readme}
            </ReactMarkdown>
          </div>
        </Tabs.TabPane>
      </Tabs>
      <Divider>
        Visibility
      </Divider>
      <Item name="isListed" label="Listed on Hub" valuePropName="checked">
        <Switch />
      </Item>
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
      {detailsSection}
      {shareUrl && tuneFile && shareSection}
    </>
  );

  if (!isUserAuthorized) {
    return <Loader />;
  }

  if (isPublished) {
    return (
      <div className="small-container">
        {shareSection}
      </div>
    );
  }

  return (
    <div className="small-container">
      <Form
        onFinish={publish}
        initialValues={{
          readme: '# My Tune\n\ndescription',
          isListed: true,
        }}
      >
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
        {/* {tuneFile && optionalSection} */}
        {optionalSection}
      </Form>
    </div>
  );
};

export default UploadPage;
