/* eslint-disable import/no-webpack-loader-syntax */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Layout,
  Tabs,
  Checkbox,
  Row,
  Skeleton,
  Progress,
  Steps,
  Space,
  Divider,
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
// eslint-disable-next-line import/no-unresolved
import MlgParserWorker from 'worker-loader!../workers/mlgParser.worker';
import {
  AppState,
  UIState,
  Config,
  OutputChannel,
  Logs,
  DatalogEntry,
} from '@speedy-tuner/types';
import { loadLogs } from '../utils/api';
import LogCanvas, { SelectedField } from './Log/LogCanvas';
import store from '../store';
import {
  formatBytes,
  msToTime,
} from '../utils/number';
import useConfig from '../hooks/useConfig';

const { TabPane } = Tabs;
const { Content } = Layout;
const { Step } = Steps;
const edgeUnknown = 'Unknown';

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
  loadedLogs: state.logs,
});

const Log = ({ ui, config, loadedLogs }: { ui: UIState, config: Config, loadedLogs: Logs }) => {
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
  const margin = 30;
  const [canvasWidth, setCanvasWidth] = useState(0);
  const sidebarWidth = 250;
  const calculateCanvasWidth = useCallback(() => setCanvasWidth((contentRef.current?.clientWidth || 0) - margin), []);
  const siderProps = {
    width: sidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) => {
      store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed });
      setTimeout(calculateCanvasWidth, 1);
    },
  };
  const [logs, setLogs] = useState<ParserResult>();
  const [fields, setFields] = useState<DatalogEntry[]>([]);
  const [selectedFields, setSelectedFields] = useState<CheckboxValueType[]>([
    // 'rpm',
    'tps',
    'afrTarget',
    'afr',
    'map',
  ]);
  const {
    isConfigReady,
    findOutputChannel,
  } = useConfig(config);
  const prepareSelectedFields = useMemo<SelectedField[]>(() => {
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

  }, [config.datalog, findOutputChannel, isConfigReady, selectedFields]);

  useEffect(() => {
    const worker = new MlgParserWorker();
    const controller = new AbortController();
    const { signal } = controller;
    const loadData = async () => {
      try {
        const raw = await loadLogs((percent, total, edge) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
          setEdgeLocation(edge || edgeUnknown);
        }, signal);

        setFileSize(formatBytes(raw.byteLength));

        worker.postMessage(raw);
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
              console.log(`Log parsed in ${data.elapsed}ms`);
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
        throw error;
      }
    };

    if (!loadedLogs.length) {
      loadData();
    }

    if (config.outputChannels) {
      setFields(Object.values(config.datalog));
    }

    calculateCanvasWidth();

    window.addEventListener('resize', calculateCanvasWidth);

    return () => {
      controller.abort();
      worker.terminate();
      window.removeEventListener('resize', calculateCanvasWidth);
    };
  }, [calculateCanvasWidth, config.datalog, config.outputChannels, loadedLogs]);

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {!logs && !loadedLogs.length ?
          <div style={{ padding: 20 }}><Skeleton active /></div>
          :
          !ui.sidebarCollapsed &&
          <Tabs defaultActiveKey="fields" style={{ marginLeft: 20 }}>
            <TabPane tab={<EditOutlined />} key="fields">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Checkbox.Group onChange={setSelectedFields} value={selectedFields}>
                  {fields.map((field) => (
                    <Row key={field.name}>
                      <Checkbox key={field.name} value={field.name}>
                        {field.label}
                        {/* {field.units && ` (${field.units})`} */}
                      </Checkbox>
                    </Row>
                  ))}
                </Checkbox.Group>
              </PerfectScrollbar>
            </TabPane>
            <TabPane tab={<FileTextOutlined />} key="files">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                some_tune.mlg
              </PerfectScrollbar>
            </TabPane>
          </Tabs>
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          <div ref={contentRef} style={{ width: '100%', marginRight: margin }}>
            {logs || !!loadedLogs.length
              ?
              <LogCanvas
                data={loadedLogs || (logs!.records as Logs)}
                width={canvasWidth}
                height={canvasWidth * 0.4}
                selectedFields={prepareSelectedFields}
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

export default connect(mapStateToProps)(Log);
