import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Divider,
  Input,
  notification,
  Skeleton,
  Space,
  Switch,
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
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useHistory } from 'react-router-dom';
import { UploadFile } from 'antd/lib/upload/interface';
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
  getStorage,
  storageRef,
  uploadBytesResumable,
  db,
} from '../firebase';
import useStorage from '../hooks/useStorage';

enum MaxFiles {
  TUNE_FILES = 1,
  LOG_FILES = 5,
  TOOTH_LOG_FILES = 5,
  CUSTOM_INI_FILES = 1,
}

interface TuneDbData {
  userUid?: string;
  createdAt?: Date;
  isPublished?: boolean;
  isListed?: boolean;
  isPublic?: boolean;
  tuneFile?: string;
  logFiles?: string[];
  toothLogFiles?: string[];
  customIniFile?: string | null;
}

const containerStyle = {
  padding: 20,
  maxWidth: 600,
  margin: '0 auto',
};

const NEW_TUNE_ID_KEY = 'newTuneId';
const MAX_FILE_SIZE_MB = 10;

const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;
const iniIcon = () => <FileTextOutlined />;

const storage = getStorage();
const nanoidCustom = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
const baseUploadPath = 'public/users';

const UploadPage = () => {
  const [newTuneId, setNewTuneId] = useState<string>();
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const hasNavigatorShare = navigator.share !== undefined;
  const [shareUrl, setShareUrl] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isListed, setIsListed] = useState(true);
  const { currentUser, refreshToken } = useAuth();
  const history = useHistory();
  const { storageSet, storageGet, storageDelete } = useStorage();
  const [tuneFiles, setTuneFiles] = useState<UploadFile[]>([]);
  const [logFiles, setLogFiles] = useState<UploadFile[]>([]);
  const [toothLogFiles, setToothLogFiles] = useState<UploadFile[]>([]);
  const [customIniFiles, setCustomIniFiles] = useState<UploadFile[]>([]);

  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const updateDbData = (tuneId: string, dbData: TuneDbData) => setDoc(fireStoreDoc(db, 'tunes', tuneId), dbData, { merge: true });

  const getDbData = (tuneId: string) => getDoc(fireStoreDoc(db, 'tunes', tuneId));

  const publish = async () => {
    setIsLoading(true);
    await updateDbData(newTuneId!, { isPublished: true });
    setIsPublished(true);
    setIsLoading(false);
  };

  const onTuneFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setTuneFiles(newFileList);
  };

  const onLogFilesChange = ({ file, fileList: newFileList }: { file: any, fileList: UploadFile[] }) => {
    setLogFiles(newFileList);
  };

  const onToothLogFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setToothLogFiles(newFileList);
  };

  const onCustomIniFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setCustomIniFiles(newFileList);
  };

  const upload = async (path: string, options: UploadRequestOption, tuneId: string, dbData: TuneDbData) => {
    const { onError, onSuccess, onProgress, file } = options;

    if ((file as File).size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      const errorName = 'File too large';
      const errorMessage = `File should not be larger than ${MAX_FILE_SIZE_MB}MB!`;
      notification.error({ message: errorName, description: errorMessage });
      onError!({ name: errorName, message: errorMessage });
      return false;
    }

    try {
      const buffer = await (file as File).arrayBuffer();

      const ref = storageRef(storage, path);
      const compressed = pako.deflate(new Uint8Array(buffer));
      const uploadTask = uploadBytesResumable(ref, compressed, {
        customMetadata: {
          name: (file as File).name,
          size: `${(file as File).size}`,
        },
      });

      uploadTask.on(
        'state_changed',
        (snap) => onProgress!({ percent: (snap.bytesTransferred / snap.totalBytes) * 100 }),
        (err) => onError!(err),
        async () => {
          await updateDbData(tuneId, dbData);
          onSuccess!(file);
        },
      );
    } catch (error) {
      console.error('Upload error:', error);
      notification.error({
        message: 'Upload error',
        description: (error as Error).message,
      });
      onError!(error as Error);
    }

    return true;
  };

  const uploadTune = async (options: UploadRequestOption) => {
    if (tuneFiles.length) {
      let newTuneIdTemp = await storageGet(NEW_TUNE_ID_KEY);
      if (!newTuneIdTemp) {
        newTuneIdTemp = nanoidCustom();
        await storageSet(NEW_TUNE_ID_KEY, newTuneIdTemp);
      }
      setNewTuneId(newTuneIdTemp);
      const found = await getDbData(newTuneIdTemp);

      if (!found.exists()) {
        const tuneData: TuneDbData = {
          userUid: currentUser!.uid,
          createdAt: new Date(),
          isPublished: false,
          isPublic,
          isListed,
          tuneFile: '',
          logFiles: [],
          toothLogFiles: [],
          customIniFile: null,
        };
        await updateDbData(newTuneIdTemp, tuneData);
      }
      setShareUrl(`https://speedytuner.cloud/#/t/${newTuneIdTemp}`);

      const path = `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/${nanoid()}.msq.gz`;
      await upload(path, options, newTuneIdTemp, { tuneFile: path });
    }
  };

  const uploadLogs = async (options: UploadRequestOption) => {
    const filename = (options.file as File).name;
    const extension = filename.split('.').pop();
    const path = `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/logs/${nanoid()}.${extension}.gz`;
    const tune = await getDbData(newTuneId!);
    upload(path, options, newTuneId!, { logFiles: [...tune.data()!.logFiles, path] });
  };

  const uploadToothLogs = async (options: UploadRequestOption) => {
    const path = `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/tooth-logs/${nanoid()}.csv.gz`;
    const tune = await getDbData(newTuneId!);
    upload(path, options, newTuneId!, { toothLogFiles: [...tune.data()!.toothLogFiles, path] });
  };

  const uploadCustomIni = async (options: UploadRequestOption) => {
    const path = `${baseUploadPath}/${currentUser!.uid}/tunes/${newTuneId}/${nanoid()}.ini.gz`;
    upload(path, options, newTuneId!, { customIniFile: path });
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
      storageDelete(NEW_TUNE_ID_KEY);
      console.error(error);
      notification.error({
        message: 'Error',
        description: (error as Error).message,
      });
    }

  }, [currentUser, history, refreshToken, storageDelete]);

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
      <Input
        style={{ width: `calc(100% - ${hasNavigatorShare ? 160 : 128}px)` }}
        value={shareUrl!}
      />
      <Tooltip title={copied ? 'Copied' : 'Copy URL'}>
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
      <Button
        type="primary"
        style={{ float: 'right' }}
        disabled={isPublished || isLoading}
        onClick={publish}
      >
        {isPublished && !isLoading ? 'Published' : 'Publish'}
      </Button>
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
        iconRender={logIcon}
        fileList={logFiles}
        onChange={onLogFilesChange}
        multiple
        maxCount={MaxFiles.LOG_FILES}
        disabled={isPublished}
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
        listType="picture-card"
        customRequest={uploadToothLogs}
        iconRender={toothLogIcon}
        fileList={toothLogFiles}
        onChange={onToothLogFilesChange}
        multiple
        maxCount={MaxFiles.TOOTH_LOG_FILES}
        accept=".csv"
      >
        {toothLogFiles.length < MaxFiles.TOOTH_LOG_FILES && uploadButton}
      </Upload>
      <Space style={{ marginTop: 30 }}>
        Show more:
        <Switch checked={showOptions} onChange={setShowOptions} />
      </Space>
      {showOptions && <>
        <Divider>
          <Space>
            Upload Custom INI
            <Typography.Text type="secondary">(.ini)</Typography.Text>
          </Space>
        </Divider>
        <Upload
          listType="picture-card"
          customRequest={uploadCustomIni}
          iconRender={iniIcon}
          fileList={customIniFiles}
          onChange={onCustomIniFilesChange}
          disabled={isPublished}
          accept=".ini"
        >
          {customIniFiles.length < MaxFiles.CUSTOM_INI_FILES && uploadButton}
        </Upload>
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
      </>}
      {shareUrl && tuneFiles.length > 0 && shareSection}
    </>
  );

  if (!isUserAuthorized) {
    return (
      <div style={containerStyle}>
        <Skeleton active />
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
        iconRender={tuneIcon}
        fileList={tuneFiles}
        onChange={onTuneFilesChange}
        disabled={isPublished}
        accept=".msq"
      >
        {tuneFiles.length < MaxFiles.TUNE_FILES && uploadButton}
      </Upload>
      {tuneFiles.length > 0 && optionalSection}
    </div>
  );
};

export default UploadPage;
