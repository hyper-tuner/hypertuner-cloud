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
import {
  requiredTextRules,
  requiredRules,
} from '../utils/form';
import { TuneDbDataPartial, TuneDbDocument } from '../types/dbData';
import { aspirationMapper } from '../utils/tune/mappers';

const { Item } = Form;

enum MaxFiles {
  TUNE_FILES = 1,
  LOG_FILES = 5,
  TOOTH_LOG_FILES = 5,
  CUSTOM_INI_FILES = 1,
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
const tuneParser = new TuneParser();

const UploadPage = () => {
  const routeMatch = useMatch(Routes.UPLOAD_WITH_TUNE_ID);

  const [isLoading, setIsLoading] = useState(false);
  const [isTuneLoading, setTuneIsLoading] = useState(true);
  const [newTuneId, setNewTuneId] = useState<string>();
  const [tuneDocumentId, setTuneDocumentId] = useState<string>();
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [readme, setReadme] = useState('# My Tune\n\ndescription');
  const [existingTune, setExistingTune] = useState<TuneDbDocument>();
  const [initialValues, setInitialValues] = useState<TuneDbDataPartial>({
    readme,
  });

  const [defaultTuneFileList, setDefaultTuneFileList] = useState<UploadFile[]>([]);
  const [defaultLogFilesList, setDefaultLogFilesList] = useState<UploadFile[]>([]);
  const [defaultToothLogFilesList, setDefaultToothLogFilesList] = useState<UploadFile[]>([]);
  const [defaultCustomIniFileList, setDefaultCustomIniFileList] = useState<UploadFile[]>([]);

  const [tuneFileId, setTuneFileId] = useState<string | null>(null);
  const [logFileIds, setLogFileIds] = useState<Map<string, string>>(new Map());
  const [toothLogFileIds, setToothLogFileIds] = useState<Map<string, string>>(new Map());
  const [customIniFileId, setCustomIniFileId] = useState<string | null>(null);

  const hasNavigatorShare = navigator.share !== undefined;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { removeFile, uploadFile, getFile } = useServerStorage();
  const { createTune, getBucketId, updateTune, getTune } = useDb();

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

  const publishTune = async (values: any) => {
    /* eslint-disable prefer-destructuring */
    const vehicleName = values.vehicleName.trim();
    const engineMake = values.engineMake.trim();
    const engineCode = values.engineCode.trim();
    const displacement = values.displacement;
    const cylindersCount = values.cylindersCount;
    const aspiration = values.aspiration.trim();
    const compression = values.compression || null;
    const fuel = values.fuel?.trim() || null;
    const ignition = values.ignition?.trim() || null;
    const injectorsSize = values.injectorsSize || null;
    const year = values.year || null;
    const hp = values.hp || null;
    const stockHp = values.stockHp || null;
    /* eslint-enable prefer-destructuring */

    setIsLoading(true);
    await updateTune(tuneDocumentId!, {
      vehicleName,
      engineMake,
      engineCode,
      displacement,
      cylindersCount,
      aspiration,
      compression,
      fuel,
      ignition,
      injectorsSize,
      year,
      hp,
      stockHp,
      readme: readme?.trim(),
      textSearch: [
        existingTune?.signature,
        vehicleName,
        engineMake,
        engineCode,
        `${displacement}l`,
        aspirationMapper[aspiration] || null,
        fuel,
        ignition,
        year,
      ].filter((field) => field !== null && `${field}`.length > 1)
        .join(' ')
        .replace(/[^A-z\d ]/g, ''),
    });
    setIsLoading(false);
    setIsPublished(true);
  };

  const validateSize = (file: File) => Promise.resolve({
    result: (file.size / 1024 / 1024) <= maxFileSizeMB,
    message: `File should not be larger than ${maxFileSizeMB}MB!`,
  });

  const navigateToNewTuneId = useCallback(() => {
    navigate(generatePath(Routes.UPLOAD_WITH_TUNE_ID, {
      tuneId: generateTuneId(),
    }), { replace: true });
  }, [navigate]);

  const upload = async (options: UploadRequestOption, done: UploadDone, validate: ValidateFile) => {
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
      const bucketId = await getBucketId(currentUser!.$id);
      const fileCreated: ServerFile = await uploadFile(currentUser!.$id, bucketId, new File([compressed], (file as File).name));

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

  const uploadTune = async (options: UploadRequestOption) => {
    upload(options, async (fileCreated: ServerFile, file: File) => {
      const { signature } = tuneParser.parse(await file.arrayBuffer()).getTune().details;

      if (tuneDocumentId) {
        await updateTune(tuneDocumentId, {
          signature,
          tuneFileId: fileCreated.$id,
        });
      } else {
        const document = await createTune({
          userId: currentUser!.$id,
          tuneId: newTuneId!,
          signature,
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
      }

      setTuneFileId(fileCreated.$id);
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      return {
        result: tuneParser.parse(await file.arrayBuffer()).isValid(),
        message: 'Tune file is not valid!',
      };
    });
  };

  const uploadLogs = async (options: UploadRequestOption) => {
    upload(options, async (fileCreated) => {
      const newValues = new Map(logFileIds.set((options.file as UploadFile).uid, fileCreated.$id));
      await updateTune(tuneDocumentId!, { logFileIds: Array.from(newValues.values()) });
      setLogFileIds(newValues);
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

      return {
        result: valid,
        message: 'Log file is empty or not valid!',
      };
    });
  };

  const uploadToothLogs = async (options: UploadRequestOption) => {
    upload(options, async (fileCreated) => {
      const newValues = new Map(toothLogFileIds.set((options.file as UploadFile).uid, fileCreated.$id));
      await updateTune(tuneDocumentId!, { toothLogFileIds: Array.from(newValues.values()) });
      setToothLogFileIds(newValues);
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      const parser = new TriggerLogsParser(await file.arrayBuffer());

      return {
        result: parser.isComposite() || parser.isTooth(),
        message: 'Tooth logs file is empty or not valid!',
      };
    });
  };

  const uploadCustomIni = async (options: UploadRequestOption) => {
    upload(options, async (fileCreated) => {
      await updateTune(tuneDocumentId!, { customIniFileId: fileCreated.$id });
      setCustomIniFileId(fileCreated.$id);
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

      return {
        result: valid,
        message: validationMessage,
      };
    });
  };

  const removeFileFromStorage = async (fileId: string) => {
    await removeFile(await getBucketId(currentUser!.$id), fileId);
  };

  const removeTuneFile = async () => {
    await removeFileFromStorage(tuneFileId!);
    await updateTune(tuneDocumentId!, { tuneFileId: null });
    setTuneFileId(null);
  };

  const removeLogFile = async (file: UploadFile) => {
    await removeFileFromStorage(logFileIds.get(file.uid)!);
    logFileIds.delete(file.uid);
    const newValues = new Map(logFileIds);
    setLogFileIds(newValues);
    updateTune(tuneDocumentId!, { logFileIds: Array.from(newValues.values()) });
  };

  const removeToothLogFile = async (file: UploadFile) => {
    await removeFileFromStorage(toothLogFileIds.get(file.uid)!);
    toothLogFileIds.delete(file.uid);
    const newValues = new Map(toothLogFileIds);
    setToothLogFileIds(newValues);
    updateTune(tuneDocumentId!, { toothLogFileIds: Array.from(newValues.values()) });
  };

  const removeCustomIniFile = async (file: UploadFile) => {
    await removeFileFromStorage(customIniFileId!);
    await updateTune(tuneDocumentId!, { customIniFileId: null });
    setCustomIniFileId(null);
  };

  const loadExistingTune = useCallback(async (currentTuneId: string) => {
    setNewTuneId(currentTuneId);
    console.info('Using tuneId:', currentTuneId);

    const existingTune = await getTune(currentTuneId);
    if (existingTune) {
      // this is someone elses tune
      if (existingTune.userId !== currentUser?.$id) {
        navigateToNewTuneId();
        return;
      }

      setExistingTune(existingTune);
      setInitialValues(existingTune);
      setIsEditMode(true);
      setTuneDocumentId(existingTune.$id);

      if (existingTune.tuneFileId) {
        const file = await getFile(existingTune.tuneFileId, await getBucketId(currentUser!.$id));
        setTuneFileId(existingTune.tuneFileId);
        setDefaultTuneFileList([{
          uid: file.$id,
          name: file.name,
          status: 'done',
        }]);
      }

      if (existingTune.customIniFileId) {
        const file = await getFile(existingTune.customIniFileId, await getBucketId(currentUser!.$id));
        setCustomIniFileId(existingTune.customIniFileId);
        setDefaultCustomIniFileList([{
          uid: file.$id,
          name: file.name,
          status: 'done',
        }]);
      }

      existingTune.logFileIds?.forEach(async (fileId: string) => {
        const file = await getFile(fileId, await getBucketId(currentUser!.$id));
        setLogFileIds((prev) => new Map(prev).set(fileId, fileId));
        setDefaultLogFilesList((prev) => [...prev, {
          uid: file.$id,
          name: file.name,
          status: 'done',
        }]);
      });

      existingTune.toothLogFileIds?.forEach(async (fileId: string) => {
        const file = await getFile(fileId, await getBucketId(currentUser!.$id));
        setToothLogFileIds((prev) => new Map(prev).set(fileId, fileId));
        setDefaultToothLogFilesList((prev) => [...prev, {
          uid: file.$id,
          name: file.name,
          status: 'done',
        }]);
      });
    }

    setTuneIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      loadExistingTune(currentTuneId);
      setShareUrl(buildFullUrl([tunePath(currentTuneId)]));
    } else {
      navigateToNewTuneId();
    }
  }, [currentUser, loadExistingTune, navigate, navigateToNewTuneId, routeMatch?.params.tuneId]);

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
            {isEditMode ? 'Update' : 'Publish'}
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
          <Item name="vehicleName" rules={requiredTextRules}>
            <Input addonBefore="Vehicle name" />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="engineMake" rules={requiredTextRules}>
            <Input addonBefore="Engine make" />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="engineCode" rules={requiredTextRules}>
            <Input addonBefore="Engine code" />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="displacement" rules={requiredRules}>
            <InputNumber addonBefore="Displacement" addonAfter="l" min={0} max={100} />
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="cylindersCount" rules={requiredRules}>
            <InputNumber addonBefore="Cylinders" style={{ width: '100%' }} min={0} max={16} />
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="aspiration" rules={requiredTextRules}>
            <Select placeholder="Aspiration" style={{ width: '100%' }}>
              <Select.Option value="na">Naturally aspirated</Select.Option>
              <Select.Option value="turbocharged">Turbocharged</Select.Option>
              <Select.Option value="supercharged">Supercharged</Select.Option>
            </Select>
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="compression">
            <InputNumber addonBefore="Compression" style={{ width: '100%' }} min={0} max={100} step={0.1} addonAfter=":1" />
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
          <Item name="year">
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
        key={defaultLogFilesList.map((file) => file.uid).join('-') || 'logs'}
        listType="picture-card"
        customRequest={uploadLogs}
        onRemove={removeLogFile}
        iconRender={logIcon}
        multiple
        maxCount={MaxFiles.LOG_FILES}
        disabled={isPublished}
        onPreview={noop}
        defaultFileList={defaultLogFilesList}
        accept=".mlg,.csv,.msl"
      >
        {logFileIds.size < MaxFiles.LOG_FILES && uploadButton}
      </Upload>
      <Divider>
        <Space>
          Upload Tooth and Composite logs
          <Typography.Text type="secondary">(.csv)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        key={defaultToothLogFilesList.map((file) => file.uid).join('-') || 'toothLogs'}
        listType="picture-card"
        customRequest={uploadToothLogs}
        onRemove={removeToothLogFile}
        iconRender={toothLogIcon}
        multiple
        maxCount={MaxFiles.TOOTH_LOG_FILES}
        onPreview={noop}
        defaultFileList={defaultToothLogFilesList}
        accept=".csv"
      >
        {toothLogFileIds.size < MaxFiles.TOOTH_LOG_FILES && uploadButton}
      </Upload>
      <Divider>
        <Space>
          Upload Custom INI
          <Typography.Text type="secondary">(.ini)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        key={defaultCustomIniFileList[0]?.uid || 'customIni'}
        listType="picture-card"
        customRequest={uploadCustomIni}
        onRemove={removeCustomIniFile}
        iconRender={iniIcon}
        disabled={isPublished}
        onPreview={noop}
        defaultFileList={defaultCustomIniFileList}
        accept=".ini"
      >
        {!customIniFileId && uploadButton}
      </Upload>
      {detailsSection}
      {shareUrl && tuneFileId && shareSection}
    </>
  );

  if (!isUserAuthorized || isTuneLoading) {
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
      <Form onFinish={publishTune} initialValues={initialValues}>
        <Divider>
          <Space>
            Upload Tune
            <Typography.Text type="secondary">(.msq)</Typography.Text>
          </Space>
        </Divider>
        <Upload
          key={defaultTuneFileList[0]?.uid || 'tuneFile'}
          listType="picture-card"
          customRequest={uploadTune}
          onRemove={removeTuneFile}
          iconRender={tuneIcon}
          disabled={isPublished}
          onPreview={noop}
          defaultFileList={defaultTuneFileList}
          accept=".msq"
        >
          {tuneFileId === null && uploadButton}
        </Upload>
        {(tuneFileId || defaultTuneFileList.length > 0) && optionalSection}
      </Form>
    </div>
  );
};

export default UploadPage;
