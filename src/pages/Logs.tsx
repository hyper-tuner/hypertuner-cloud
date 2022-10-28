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
  OutputChannel,
  Logs as LogsType,
  DatalogEntry,
} from '@hyper-tuner/types';
// eslint-disable-next-line import/no-unresolved
import LogParserWorker from '../workers/logParserWorker?worker';
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
  ConfigState,
  LogsState,
  TuneDataState,
  UIState,
} from '../types/state';
import Loader from '../components/Loader';
import { Colors } from '../utils/colors';
import useServerStorage from '../hooks/useServerStorage';
import { Routes } from '../routes';
import { removeFilenameSuffix } from '../pocketbase';
import { isAbortedRequest } from '../utils/error';
import { WorkerOutput } from '../workers/logParserWorker';

const { Content } = Layout;
const { Step } = Steps;
const edgeUnknown = 'Unknown';
const sidebarWidth = 250;
const minCanvasHeightInner = 500;
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
  ui: UIState;
  config: ConfigState;
  loadedLogs: LogsState;
  tuneData: TuneDataState | null;
}) => {
  const { lg } = useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [parseElapsed, setParseElapsed] = useState<string>();
  const [samplesCount, setSamplesCount] = useState<number>();
  const [fetchError, setFetchError] = useState<Error>();
  const [parseError, setParseError] = useState<Error>();
  const [step, setStep] = useState(0);
  const [edgeLocation, setEdgeLocation] = useState(edgeUnknown);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [showSingleGraph, setShowSingleGraph] = useState(false);
  const { fetchLogFileWithProgress } = useServerStorage();
  const routeMatch = useMatch(Routes.TUNE_LOGS_FILE);
  const navigate = useNavigate();

  const calculateCanvasSize = useCallback(() => {
    setCanvasWidth(contentRef.current?.clientWidth || 0);

    if (window.innerHeight > minCanvasHeightInner) {
      setCanvasHeight(Math.round((window.innerHeight - 170) / 2));
      setShowSingleGraph(false);
    } else {
      // not enough space to put 2 graphs
      setCanvasHeight(Math.round(window.innerHeight - 115));
      setShowSingleGraph(true);
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
    const worker = new LogParserWorker();
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      const logFileName = routeMatch?.params.fileName!;

      // user didn't upload any logs
      if (tuneData && (tuneData.logFiles || []).length === 0) {
        navigate(Routes.HUB);

        return;
      }

      try {
        const raw = await fetchLogFileWithProgress(tuneData!.id, logFileName, (percent, total, edge) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
          setEdgeLocation(edge || edgeUnknown);
        }, signal);

        setFileSize(formatBytes(raw.byteLength));

        worker.postMessage(raw);

        worker.onmessage = ({ data }: { data: WorkerOutput }) => {
          switch (data.type) {
            case 'progress':
              setStep(1);
              setProgress(data.progress!);
              setParseElapsed(msToTime(data.elapsed!));
              break;
            case 'result':
              setLogs(data.result);
              store.dispatch({
                type: 'logs/load', payload: {
                  fileName: logFileName,
                  logs: data.result!.records,
                },
              });
              break;
            case 'metrics':
              setParseElapsed(msToTime(data.elapsed!));
              setSamplesCount(data.records!);
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
        if (isAbortedRequest(error as Error)) {
          return;
        }

        setFetchError(error as Error);
      }
    };

    // user navigated to logs root page
    if (!routeMatch?.params.fileName && tuneData && tuneData.logFiles?.length) {
      // either redirect to the first log or to the latest selected
      if (loadedLogs.fileName) {
        navigate(generatePath(Routes.TUNE_LOGS_FILE, { tuneId: tuneData.tuneId, fileName: loadedLogs.fileName }));
      } else {
        const firstLogFile = (tuneData.logFiles || [])[0];
        navigate(generatePath(Routes.TUNE_LOGS_FILE, { tuneId: tuneData.tuneId, fileName: firstLogFile }));
      }

      return undefined;
    }

    // first visit, logs are not loaded yet
    if (!(loadedLogs.logs || []).length && tuneData?.tuneId) {
      loadData();
    }

    // file changed, reload
    if ((loadedLogs.logs || []).length && loadedLogs.fileName !== routeMatch?.params.fileName) {
      setLogs(undefined);
      store.dispatch({ type: 'logs/load', payload: {} });
      loadData();
    }

    if (config?.outputChannels) {
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
  }, [calculateCanvasSize, config?.datalog, config?.outputChannels, ui.sidebarCollapsed, routeMatch?.params.fileName]);

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {!(loadedLogs?.logs || []).length ?
          <Loader />
          :
          !ui.sidebarCollapsed &&
          <Tabs
            defaultActiveKey="fields"
            style={{ marginLeft: 20 }}
            items={[
              {
                label: (
                  <Badge size="small" style={badgeStyle} count={fields.length} offset={[10, -3]}>
                    <EditOutlined />Fields
                  </Badge>
                ),
                key: 'fields',
                children: (
                  <>
                    <div style={showSingleGraph ? {} : { height: '45%' }}>
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
                    {!showSingleGraph && (
                      <>
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
                    )}
                  </>
                ),
              },
              {
                label: (
                  <Badge size="small" style={badgeStyle} count={tuneData?.logFiles?.length} offset={[10, -3]}>
                    <FileTextOutlined />Files
                  </Badge>
                ),
                key: 'files',
                children: (
                  <PerfectScrollbar options={{ suppressScrollX: true }}>
                    {tuneData?.logFiles?.map((fileName) => (
                      <Typography.Paragraph key={fileName} ellipsis>
                        <Link
                          to={generatePath(Routes.TUNE_LOGS_FILE, { tuneId: tuneData.tuneId, fileName })}
                          style={
                            routeMatch?.params.fileName === fileName ?
                              {} : { color: 'inherit' }
                          }
                        >
                          {removeFilenameSuffix(fileName)}
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
      <Layout className="logs-container">
        <Content>
          <div ref={contentRef}>
            {logs || !!(loadedLogs.logs || []).length
              ?
              <LogCanvas
                data={loadedLogs.logs || (logs!.records as LogsType)}
                width={canvasWidth}
                height={canvasHeight}
                selectedFields1={prepareSelectedFields(selectedFields1)}
                selectedFields2={prepareSelectedFields(selectedFields2)}
                showSingleGraph={showSingleGraph}
              />
              :
              <Space
                direction="vertical"
                size="large"
              >
                <Progress
                  type="circle"
                  percent={progress}
                  status={(fetchError || parseError) && 'exception'}
                  className="logs-progress"
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
