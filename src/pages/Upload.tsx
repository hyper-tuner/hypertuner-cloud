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
  Row,
  Select,
  Space,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  Form,
  AutoComplete,
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  FundOutlined,
  SettingOutlined,
  CopyOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  EditOutlined,
  CheckOutlined,
  SendOutlined,
  GlobalOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import debounce from 'lodash.debounce';
import { INI } from '@hyper-tuner/ini';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { UploadFile } from 'antd/lib/upload/interface';
import {
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import Pako from 'pako';
import ReactMarkdown from 'react-markdown';
import { nanoid } from 'nanoid';
import {
  emailNotVerified,
  error,
  restrictedPage,
  signatureNotSupportedWarning,
} from './auth/notifications';
import { useAuth } from '../contexts/AuthContext';
import { Routes } from '../routes';
import TuneParser from '../utils/tune/TuneParser';
import TriggerLogsParser from '../utils/logs/TriggerLogsParser';
import LogValidator from '../utils/logs/LogValidator';
import useDb from '../hooks/useDb';
import useServerStorage from '../hooks/useServerStorage';
import { buildFullUrl } from '../utils/url';
import Loader from '../components/Loader';
import {
  requiredTextRules,
  requiredRules,
} from '../utils/form';
import { aspirationMapper } from '../utils/tune/mappers';
import { copyToClipboard } from '../utils/clipboard';
import { TunesRecord } from '../@types/pocketbase-types';
import {
  TunesRecordFull,
  TunesRecordPartial,
} from '../types/dbData';
import { removeFilenameSuffix } from '../pocketbase';

const { Item, useForm } = Form;

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

interface UploadedFile extends File {
  uid: string | undefined;
}

type ValidateFile = (file: File) => Promise<ValidationResult>;

const rowProps = { gutter: 10 };
const colProps = { span: 24, sm: 12 };

const maxFileSizeMB = 50;
const descriptionEditorHeight = 260;
const thisYear = (new Date()).getFullYear();
const generateTuneId = () => nanoid(10);
const defaultReadme = '# My Tune\n\ndescription';

const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;
const iniIcon = () => <FileTextOutlined />;

const tunePath = (tuneId: string) => generatePath(Routes.TUNE_TUNE, { tuneId });
const tuneParser = new TuneParser();

const bufferToFile = (buffer: ArrayBuffer, name: string) => new File([buffer], name);

const UploadPage = () => {
  const [form] = useForm();
  const routeMatch = useMatch(Routes.UPLOAD_WITH_TUNE_ID);

  const [isLoading, setIsLoading] = useState(false);
  const [isTuneLoading, setTuneIsLoading] = useState(true);
  const [newTuneId, setNewTuneId] = useState<string>();
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>();
  const [isPublished, setIsPublished] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [readme, setReadme] = useState(defaultReadme);
  const [existingTune, setExistingTune] = useState<TunesRecordFull>();

  const [defaultTuneFileList, setDefaultTuneFileList] = useState<UploadFile[]>([]);
  const [defaultLogFilesList, setDefaultLogFilesList] = useState<UploadFile[]>([]);
  const [defaultToothLogFilesList, setDefaultToothLogFilesList] = useState<UploadFile[]>([]);
  const [defaultCustomIniFileList, setDefaultCustomIniFileList] = useState<UploadFile[]>([]);

  const [tuneFile, setTuneFile] = useState<File>();
  const [customIniFile, setCustomIniFile] = useState<File>();
  const [logFiles, setLogFiles] = useState<File[]>([]);
  const [toothLogFiles, setToothLogFiles] = useState<File[]>([]);

  const shareSupported = 'share' in navigator;
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { fetchTuneFile, fetchINIFile } = useServerStorage();
  const { createTune, updateTune, getTune, autocomplete } = useDb();

  const [autocompleteOptions, setAutocompleteOptions] = useState<{ [attribute: string]: { value: string }[] }>({});

  const searchAutocomplete = debounce(async (attribute: string, search: string) => {
    if (search.length === 0) {
      setAutocompleteOptions((prev) => ({ ...prev, [attribute]: [] }));
      return;
    }

    const options = (await autocomplete(attribute, search))
      .map((record) => record[attribute]);

    // TODO: order by occurrence (more common - higher in the list)
    const unique = [...new Set(options)].map((value) => ({ value }));

    setAutocompleteOptions((prev) => ({ ...prev, [attribute]: unique }));
  }, 300);

  const fetchFile = async (tuneId: string, fileName: string) => bufferToFile(await fetchTuneFile(tuneId, fileName), fileName);

  const noop = () => { };

  const goToNewTune = () => navigate(generatePath(Routes.TUNE_TUNE, {
    tuneId: newTuneId!,
  }));

  const publishTune = async (values: any) => {
    setIsLoading(true);

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
    const visibility = values.visibility;
    /* eslint-enable prefer-destructuring */

    const compressedTuneFile = bufferToFile(
      Pako.deflate(await tuneFile!.arrayBuffer()),
      (tuneFile as UploadedFile).uid ? tuneFile!.name : removeFilenameSuffix(tuneFile!.name),
    );

    const compressedCustomIniFile = customIniFile ? bufferToFile(
      Pako.deflate(await customIniFile!.arrayBuffer()),
      (customIniFile as UploadedFile).uid ? customIniFile!.name : removeFilenameSuffix(customIniFile!.name),
    ) : null;

    const compressedLogFiles = await Promise.all(logFiles.map(async (file) => bufferToFile(
      Pako.deflate(await file.arrayBuffer()),
      (file as UploadedFile).uid ? file.name : removeFilenameSuffix(file.name),
    )));

    const compressedToothLogFiles = await Promise.all(toothLogFiles.map(async (file) => bufferToFile(
      Pako.deflate(await file.arrayBuffer()),
      (file as UploadedFile).uid ? file.name : removeFilenameSuffix(file.name),
    )));

    const { signature } = tuneParser.parse(await tuneFile!.arrayBuffer()).getTune().details;

    const newData: TunesRecord = {
      author: currentUser!.id,
      tuneId: newTuneId!,
      signature,
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
      visibility,
      tuneFile: compressedTuneFile as unknown as string,
      customIniFile: compressedCustomIniFile as unknown as string,
      logFiles: compressedLogFiles as unknown as string[],
      toothLogFiles: compressedToothLogFiles as unknown as string[],
      textSearch: [
        signature,
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
        .replace(/[^\w.\-\d ]/g, ''),
    };

    const formData = new FormData();

    Object.keys(newData).forEach((key) => {
      const value = (newData as any)[key];

      if (Array.isArray(value)) {
        value.forEach((file: File) => {
          formData.append(key, file);
        });
      } else {
        formData.append(key, value);
      }
    });

    if (existingTune) {
      // clear old multi files first
      if (logFiles.length > 0 || toothLogFiles.length > 0) {
        const tempFormData = new FormData();
        tempFormData.append('logFiles', '');
        tempFormData.append('toothLogFiles', '');
        await updateTune(existingTune.id, tempFormData as unknown as TunesRecord);
      }

      await updateTune(existingTune.id, formData as unknown as TunesRecord);
    } else {
      await createTune(formData as unknown as TunesRecord);
    }

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

  const upload = async (options: UploadRequestOption, done: (file: File) => void, validate: ValidateFile) => {
    const { onError, onSuccess, file } = options;

    const validation = await validate(file as File);
    if (!validation.result) {
      const errorName = 'Validation failed';
      const errorMessage = validation.message;
      error(errorName, errorMessage);
      onError!({ name: errorName, message: errorMessage });

      return false;
    }

    done(file as File);
    onSuccess!(null);

    return true;
  };

  const uploadTune = async (options: UploadRequestOption) => {
    upload(options, async (file) => {
      setTuneFile(file);
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      const parsed = tuneParser.parse(await file.arrayBuffer());

      try {
        await fetchINIFile(parsed.getTune().details.signature);
      } catch (e) {
        signatureNotSupportedWarning((e as Error).message);
      }

      return {
        result: parsed.isValid(),
        message: 'Tune file is not valid!',
      };
    });
  };

  const uploadLogs = async (options: UploadRequestOption) => {
    upload(options, async (file) => {
      setLogFiles((prev) => [...prev, file]);
    }, async (file) => {
      const { result, message } = await validateSize(file);
      if (!result) {
        return { result, message };
      }

      let valid = true;
      const extension = file.name.split('.').pop();
      const parser = new LogValidator(await file.arrayBuffer());

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
    upload(options, async (file) => {
      setToothLogFiles((prev) => [...prev, file]);
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
    upload(options, async (file) => {
      setCustomIniFile(file);
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
      } catch (e) {
        valid = false;
        validationMessage = (e as Error).message;
      }

      return {
        result: valid,
        message: validationMessage,
      };
    });
  };

  const removeTuneFile = async () => {
    setTuneFile(undefined);
  };

  const removeLogFile = async (file: UploadFile) => {
    setLogFiles((prev) => prev.filter((f) => f.name !== file.name));
  };

  const removeToothLogFile = async (file: UploadFile) => {
    setToothLogFiles((prev) => prev.filter((f) => f.name !== file.name));
  };

  const removeCustomIniFile = async (file: UploadFile) => {
    setCustomIniFile(undefined);
  };

  const loadExistingTune = useCallback(async (currentTuneId: string) => {
    setNewTuneId(currentTuneId);
    const oldTune = await getTune(currentTuneId);

    if (oldTune) {
      // this is someone elses tune
      if (oldTune.author !== currentUser?.id) {
        navigateToNewTuneId();
        return;
      }

      setExistingTune(oldTune);
      form.setFieldsValue(oldTune);
      setIsEditMode(true);
      setReadme(oldTune.readme!);

      if (oldTune.tuneFile) {
        setTuneFile(await fetchFile(oldTune.id, oldTune.tuneFile));
        setDefaultTuneFileList([{
          uid: oldTune.tuneFile,
          name: oldTune.tuneFile,
          status: 'done',
        }]);
      }

      if (oldTune.customIniFile) {
        setCustomIniFile(await fetchFile(oldTune.id, oldTune.customIniFile));
        setDefaultCustomIniFileList([{
          uid: oldTune.customIniFile,
          name: oldTune.customIniFile,
          status: 'done',
        }]);
      }

      const tempLogFiles: File[] = [];
      oldTune.logFiles?.forEach(async (fileName: string) => {
        tempLogFiles.push(await fetchFile(oldTune.id, fileName));
        setDefaultLogFilesList((prev) => [...prev, {
          uid: fileName,
          name: fileName,
          status: 'done',
        }]);
      });
      setLogFiles(tempLogFiles);

      const tempToothLogFiles: File[] = [];
      oldTune.toothLogFiles?.forEach(async (fileName: string) => {
        tempToothLogFiles.push(await fetchFile(oldTune.id, fileName));
        setDefaultToothLogFilesList((prev) => [...prev, {
          uid: fileName,
          name: fileName,
          status: 'done',
        }]);
      });
      setToothLogFiles(tempToothLogFiles);

    } else {
      // reset state
      form.resetFields();
      setReadme(defaultReadme);
      setTuneFile(undefined);
      setCustomIniFile(undefined);
      setDefaultTuneFileList([]);
      setDefaultLogFilesList([]);
      setDefaultToothLogFilesList([]);
      setDefaultCustomIniFileList([]);
    }

    setTuneIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, form, navigateToNewTuneId]);

  const prepareData = useCallback(async () => {
    const currentTuneId = routeMatch?.params.tuneId;
    if (currentTuneId) {
      loadExistingTune(currentTuneId);
      setShareUrl(buildFullUrl([tunePath(currentTuneId)]));
    } else {
      navigateToNewTuneId();
    }
  }, [loadExistingTune, navigateToNewTuneId, routeMatch?.params.tuneId]);

  useEffect(() => {
    refreshUser().then((user) => {
      if (user === null) {
        restrictedPage();
        navigate(Routes.LOGIN);

        return;
      }

      if (!user) {
        restrictedPage();
        navigate(Routes.LOGIN);

        return;
      }

      if (!user.verified) {
        emailNotVerified();
        navigate(Routes.PROFILE);

        return;
      }

      setIsUserAuthorized(true);
      prepareData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMatch?.params.tuneId]);

  const uploadButton = (
    <Space direction="vertical">
      <PlusOutlined />Upload
    </Space>
  );

  const publishButton = (
    <Row style={{ marginTop: 10 }} {...rowProps}>
      <Col {...colProps}>
        <Item name="visibility">
          <Select disabled>
            <Select.Option value="public">
              <Space><GlobalOutlined />Public</Space>
            </Select.Option>
            <Select.Option value="unlisted">
              <Space><EyeOutlined />Unlisted</Space>
            </Select.Option>
          </Select>
        </Item>
      </Col>
      <Col {...colProps}>
        <Item style={{ width: '100%' }}>
          <Button
            type="primary"
            block
            loading={isLoading}
            htmlType="submit"
            icon={isEditMode ? <EditOutlined /> : <CheckOutlined />}
          >
            {isEditMode ? 'Update' : 'Publish'}
          </Button>
        </Item>
      </Col>
    </Row>
  );

  const openButton = (
    <>
      <Row>
        <Input
          style={{ width: `calc(100% - ${shareSupported ? 65 : 35}px)` }}
          value={shareUrl!}
        />
        <Tooltip title="Copy URL">
          <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(shareUrl!)} />
        </Tooltip>
        {shareSupported && (
          <Tooltip title="Share">
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => navigator.share({ url: shareUrl! })}
            />
          </Tooltip>
        )}
      </Row>
      <Row style={{ marginTop: 10 }}>
        <Item style={{ width: '100%' }}>
          <Button
            type="primary"
            block
            onClick={goToNewTune}
            icon={<SendOutlined />}
          >
            Open
          </Button>
        </Item>
      </Row>
    </>
  );

  const shareSection = (
    <>
      <Divider>Publish & Share</Divider>
      {isPublished ? openButton : publishButton}
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
            <AutoComplete
              options={autocompleteOptions.vehicleName}
              onSearch={(search) => searchAutocomplete('vehicleName', search)}
              backfill
            >
              <Input addonBefore="Vehicle name" />
            </AutoComplete>
          </Item>
        </Col>
      </Row>
      <Row {...rowProps}>
        <Col {...colProps}>
          <Item name="engineMake" rules={requiredTextRules}>
            <AutoComplete
              options={autocompleteOptions.engineMake}
              onSearch={(search) => searchAutocomplete('engineMake', search)}
              backfill
            >
              <Input addonBefore="Engine make" />
            </AutoComplete>
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="engineCode" rules={requiredTextRules}>
            <AutoComplete
              options={autocompleteOptions.engineCode}
              onSearch={(search) => searchAutocomplete('engineCode', search)}
              backfill
            >
              <Input addonBefore="Engine code" />
            </AutoComplete>
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
          <Item name="aspiration">
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
            <AutoComplete
              options={autocompleteOptions.fuel}
              onSearch={(search) => searchAutocomplete('fuel', search)}
              backfill
            >
              <Input addonBefore="Fuel" />
            </AutoComplete>
          </Item>
        </Col>
        <Col {...colProps}>
          <Item name="ignition">
            <AutoComplete
              options={autocompleteOptions.ignition}
              onSearch={(search) => searchAutocomplete('ignition', search)}
              backfill
            >
              <Input addonBefore="Ignition" />
            </AutoComplete>
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
      <Tabs
        defaultActiveKey="source"
        className="upload-readme"
        items={[
          {
            label: 'Edit',
            key: 'source',
            style: { height: descriptionEditorHeight },
            children: (
              <Input.TextArea
                rows={10}
                showCount
                value={readme}
                onChange={(e) => setReadme(e.target.value)}
                maxLength={3_000}
              />
            ),
          },
          {
            label: 'Preview',
            key: 'preview',
            style: { height: descriptionEditorHeight },
            children: (
              <div className="markdown-preview">
                <ReactMarkdown>
                  {readme}
                </ReactMarkdown>
              </div>
            ),
          },
        ]}
      />
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
        {logFiles.length < MaxFiles.LOG_FILES && uploadButton}
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
        {toothLogFiles.length < MaxFiles.TOOTH_LOG_FILES && uploadButton}
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
        {!customIniFile && uploadButton}
      </Upload>
      {detailsSection}
      {shareUrl && tuneFile && shareSection}
    </>
  );

  if (isPublished) {
    return (
      <div className="small-container">
        {shareSection}
      </div>
    );
  }

  if (!isUserAuthorized || isTuneLoading) {
    return (
      <Form form={form}>
        <Loader />
      </Form>
    );
  }

  return (
    <div className="small-container">
      <Form
        initialValues={{
          aspiration: 'na',
          readme,
          visibility: 'public',
          cylindersCount: 4,
          displacement: 1.6,
          year: thisYear,
        } as TunesRecordPartial}
        form={form}
        onFinish={publishTune}
      >
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
          {tuneFile === undefined && uploadButton}
        </Upload>
        {(tuneFile || defaultTuneFileList.length > 0) && optionalSection}
      </Form>
    </div>
  );
};

export default UploadPage;
