import {
  Link,
  generatePath,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Layout,
  Tabs,
  Checkbox,
  Row,
  Progress,
  Steps,
  Space,
  Divider,
  Badge,
  Typography,
} from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { connect } from 'react-redux';
import { Result as ParserResult } from 'mlg-converter/dist/types';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Config,
  OutputChannel,
  Logs as LogsType,
  DatalogEntry,
} from '@hyper-tuner/types';
// eslint-disable-next-line import/no-unresolved
import MlgParserWorker from '../workers/mlgParser?worker';
import LogCanvas from '../components/Logs/LogCanvas';
import store from '../store';
import {
  formatBytes,
  msToTime,
} from '../utils/numbers';
import useConfig from '../hooks/useConfig';
import {
  isExpression,
  stripExpression,
} from '../utils/tune/expression';
import {
  AppState,
  UIState,
} from '../types/state';
import Loader from '../components/Loader';
import { Colors } from '../utils/colors';
import { TunesRecordFull } from '../types/dbData';
import useServerStorage from '../hooks/useServerStorage';
import { Routes } from '../routes';

const { Content } = Layout;
const { Step } = Steps;
const edgeUnknown = 'Unknown';
const margin = 30;
const sidebarWidth = 250;
const minCanvasHeightInner = 600;

const badgeStyle = { backgroundColor: Colors.TEXT };

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  config: state.config,
  loadedLogs: state.logs,
  tuneData: state.tuneData,
});

const Logs = ({
  ui,
  config,
  loadedLogs,
  tuneData,
}: {
  ui: UIState,
  config: Config,
  loadedLogs: LogsType,
  tuneData: TunesRecordFull,
}) => {
  const { lg } = useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [parseElapsed, setParseElapsed] = useState<string>();
  const [samplesCount, setSamplesCount] = useState();
  const [fetchError, setFetchError] = useState<Error>();
  const [parseError, setParseError] = useState<Error>();
  const [step, setStep] = useState(0);
  const [edgeLocation, setEdgeLocation] = useState(edgeUnknown);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const { fetchLogFileWithProgress } = useServerStorage();
  const routeMatch = useMatch(Routes.TUNE_LOGS_FILE);
  const navigate = useNavigate();

  const calculateCanvasSize = useCallback(() => {
    setCanvasWidth((contentRef.current?.clientWidth || 0) - margin);

    if (window.innerHeight > minCanvasHeightInner) {
      setCanvasHeight(Math.round((window.innerHeight - 250) / 2));
    } else {
      setCanvasHeight(minCanvasHeightInner / 2);
    }
  }, []);

  const siderProps = {
    width: sidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) => {
      store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed });
    },
  };
  const [logs, setLogs] = useState<ParserResult>();
  const [fields, setFields] = useState<DatalogEntry[]>([]);
  const [selectedFields1, setSelectedFields1] = useState<CheckboxValueType[]>([
    'rpm',
    'tps',
    'map',
  ]);
  const [selectedFields2, setSelectedFields2] = useState<CheckboxValueType[]>([
    'afrTarget',
    'afr',
    'dwell',
  ]);
  const { isConfigReady, findOutputChannel } = useConfig(config);
  const prepareSelectedFields = useCallback((selectedFields: CheckboxValueType[]) => {
    if (!isConfigReady) {
      return [];
    }

    return Object.values(config.datalog).map((entry: DatalogEntry) => {
      const { units, scale, transform } = findOutputChannel(entry.name) as OutputChannel;
      const { name, label, format } = entry;

      if (!selectedFields.includes(name)) {
        return null as any;
      }

      // TODO: evaluate condition
      return {
        name,
        label,
        units,
        scale,
        transform,
        format,
      };
    }).filter((val) => !!val);

  }, [config?.datalog, findOutputChannel, isConfigReady]);

  useEffect(() => {
    const worker = new MlgParserWorker();
    const controller = new AbortController();
    const { signal } = controller;
    const loadData = async () => {
      let logFileName: string;

      if (routeMatch?.params.fileName) {
        logFileName = routeMatch?.params.fileName;
      } else {
        const firstLogFile = (tuneData.logFiles || [])[0];

        if (firstLogFile) {
          navigate(generatePath(Routes.TUNE_LOGS_FILE, { tuneId: tuneData.tuneId, fileName: firstLogFile }));
        }

        logFileName = firstLogFile;
      }

      try {
        const raw = await fetchLogFileWithProgress(tuneData.id, logFileName, (percent, total, edge) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
          setEdgeLocation(edge || edgeUnknown);
        }, signal);

        setFileSize(formatBytes(raw.byteLength));

        const pako = await import('pako');
        worker.postMessage(pako.inflate(new Uint8Array(raw)).buffer);

        worker.onmessage = ({ data }) => {
          switch (data.type) {
            case 'progress':
              setStep(1);
              setProgress(data.progress);
              setParseElapsed(msToTime(data.elapsed));
              break;
            case 'result':
              setLogs(data.result);
              store.dispatch({ type: 'logs/load', payload: data.result.records });
              break;
            case 'metrics':
              console.info(`Log parsed in ${data.elapsed}ms`);
              setParseElapsed(msToTime(data.elapsed));
              setSamplesCount(data.records);
              setStep(2);
              break;
            case 'error':
              setParseError(data.error);
              break;
            default:
              break;
          }
        };
      } catch (error) {
        setFetchError(error as Error);
      }
    };

    if (!loadedLogs.length && tuneData.tuneId) {
      loadData();
    }

    if (config.outputChannels) {
      setFields(Object.values(config.datalog));
    }

    calculateCanvasSize();

    window.addEventListener('resize', calculateCanvasSize);

    return () => {
      controller.abort();
      worker.terminate();
      window.removeEventListener('resize', calculateCanvasSize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateCanvasSize, config?.datalog, config?.outputChannels, loadedLogs, ui.sidebarCollapsed]);

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {!logs && !loadedLogs.length ?
          <Loader />
          :
          !ui.sidebarCollapsed &&
          <Tabs
            defaultActiveKey="fields"
            style={{ marginLeft: 20 }}
            items={[
              {
                label: <><EditOutlined /><Badge size="small" style={badgeStyle} count={fields.length} /></>,
                key: 'fields',
                children: (
                  <>
                    <div style={{ height: '45%' }}>
                      <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <Checkbox.Group onChange={setSelectedFields1} value={selectedFields1}>
                          {fields.map((field) => (
                            <Row key={field.name}>
                              <Checkbox key={field.name} value={field.name}>
                                {isExpression(field.label) ? stripExpression(field.label) : field.label}
                              </Checkbox>
                            </Row>
                          ))}
                        </Checkbox.Group>
                      </PerfectScrollbar>
                    </div>
                    <Divider />
                    <div style={{ height: '45%' }}>
                      <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <Checkbox.Group onChange={setSelectedFields2} value={selectedFields2}>
                          {fields.map((field) => (
                            <Row key={field.name}>
                              <Checkbox key={field.name} value={field.name}>
                                {isExpression(field.label) ? stripExpression(field.label) : field.label}
                              </Checkbox>
                            </Row>
                          ))}
                        </Checkbox.Group>
                      </PerfectScrollbar>
                    </div>
                  </>
                ),
              },
              {
                label: <><FileTextOutlined /><Badge size="small" style={badgeStyle} count={tuneData.logFiles?.length} /></>,
                key: 'files',
                children: (
                  <PerfectScrollbar options={{ suppressScrollX: true }}>
                    {tuneData.logFiles?.map((fileName) => (
                      <Typography.Paragraph key={fileName}>
                        <Link
                          to={generatePath(Routes.TUNE_LOGS_FILE, { tuneId: tuneData.tuneId, fileName })}
                          style={
                            routeMatch?.params.fileName === fileName ?
                              {} : { color: 'inherit' }
                          }
                        >
                          {fileName}
                        </Link>
                      </Typography.Paragraph>
                    ))}
                  </PerfectScrollbar>
                ),
              },
            ]}
          />
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          <div ref={contentRef} style={{ width: '100%', marginRight: margin }}>
            {logs || !!loadedLogs.length
              ?
              <LogCanvas
                data={loadedLogs || (logs!.records as LogsType)}
                width={canvasWidth}
                height={canvasHeight}
                selectedFields1={prepareSelectedFields(selectedFields1)}
                selectedFields2={prepareSelectedFields(selectedFields2)}
              />
              :
              <Space
                direction="vertical"
                size="large"
                style={{ width: '80%', maxWidth: 1000 }}
              >
                <Progress
                  type="circle"
                  percent={progress}
                  status={(fetchError || parseError) && 'exception'}
                  width={170}
                />
                <Divider />
                <Steps current={step} direction={lg ? 'horizontal' : 'vertical'}>
                  <Step
                    title="Downloading"
                    subTitle={fileSize}
                    description={
                      fetchError ? fetchError!.message : <Space>
                        <GlobalOutlined />{edgeLocation}
                      </Space>
                    }
                    status={fetchError && 'error'}
                  />
                  <Step
                    title="Decoding"
                    description={parseError ? parseError!.message : 'Reading ones and zeros'}
                    subTitle={parseElapsed}
                    status={parseError && 'error'}
                  />
                  <Step
                    title="Rendering"
                    description="Putting pixels on your screen"
                    subTitle={samplesCount && `${samplesCount} samples`}
                  />
                </Steps>
              </Space>
            }
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default connect(mapStateToProps)(Logs);
