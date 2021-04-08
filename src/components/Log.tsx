/* eslint-disable import/no-webpack-loader-syntax */
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
  Skeleton,
  Progress,
  Steps,
  Space,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { connect } from 'react-redux';
import {
  Field,
  Result as ParserResult,
} from 'mlg-converter/dist/types';
import PerfectScrollbar from 'react-perfect-scrollbar';
// eslint-disable-next-line import/no-unresolved
import MlgParserWorker from 'worker-loader!../workers/mlgParser.worker';
import { loadLogs } from '../utils/api';
import Canvas, { LogEntry } from './Log/Canvas';
import {
  AppState,
  UIState,
} from '../types/state';
import { Config } from '../types/config';
import store from '../store';
import {
  formatBytes,
  msToTime,
} from '../utils/number';

const { TabPane } = Tabs;
const { Content } = Layout;
const { Step } = Steps;

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
});

const Log = ({ ui, config }: { ui: UIState, config: Config }) => {
  const { lg } = useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [parseElapsed, setParseElapsed] = useState<string>();
  const [samplesCount, setSamplesCount] = useState();
  const [fetchError, setFetchError] = useState<Error>();
  const [parseError, setParseError] = useState<Error>();
  const [step, setStep] = useState(0);
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
  } as any;
  const [logs, setLogs] = useState<ParserResult>();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<CheckboxValueType[]>([
    'RPM',
    'TPS',
    'AFR Target',
    'AFR',
    'MAP',
  ]);

  useEffect(() => {
    const worker = new MlgParserWorker();
    const controller = new AbortController();
    const { signal } = controller;
    const loadData = async () => {
      try {
        const raw = await loadLogs((percent, total) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
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
              setFields(data.result.fields);
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
        setFetchError(error);
        throw error;
      }
    };

    loadData();
    calculateCanvasWidth();

    window.addEventListener('resize', calculateCanvasWidth);

    return () => {
      controller.abort();
      worker.terminate();
      window.removeEventListener('resize', calculateCanvasWidth);
    };
  }, [calculateCanvasWidth]);

  return (
    <>
      <Sider {...siderProps} className="app-sidebar">
        {!logs ?
          <div style={{ padding: 20 }}><Skeleton active /></div>
          :
          !ui.sidebarCollapsed &&
          <Tabs defaultActiveKey="fields" style={{ marginLeft: 20 }}>
            <TabPane tab={<EditOutlined />} key="fields">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Checkbox.Group onChange={setSelectedFields} value={selectedFields}>
                  {fields.map((field) => (
                    <Row key={field.name}>
                      <Checkbox key={field.name} value={field.name}>{field.name}</Checkbox>
                    </Row>
                  ))}
                </Checkbox.Group>
              </PerfectScrollbar>
            </TabPane>
            <TabPane tab={<FileTextOutlined />} key="files">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                Files
              </PerfectScrollbar>
            </TabPane>
            <TabPane tab={<DashboardOutlined />} key="gauges">
              Gauges
            </TabPane>
          </Tabs>
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          <div ref={contentRef} style={{ width: '100%', marginRight: margin }}>
            {!logs ?
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
                    description={fetchError ? fetchError!.message : 'Edge location: FRA53-C1'}
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
              :
              <Canvas
                data={logs!.records as LogEntry[]}
                width={canvasWidth}
                height={600}
              />
            }
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default connect(mapStateToProps)(Log);
