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
  Skeleton,
  Progress,
  Steps,
  Space,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import pako from 'pako';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { connect } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  AppState,
  UIState,
  Config,
  Logs,
} from '@speedy-tuner/types';
import { loadCompositeLogs } from '../utils/api';
import store from '../store';
import { formatBytes } from '../utils/number';
import CompositeCanvas from './TriggerLog/CompositeCanvas';
import { isNumber } from '../utils/tune/expression';
import TriggerLogsParser, { CompositeLogEntry } from '../utils/logs/TriggerLogsParser';

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

const Diagnose = ({ ui, config, loadedLogs }: { ui: UIState, config: Config, loadedLogs: Logs }) => {
  const { lg } = useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [step, setStep] = useState(0);
  const [edgeLocation, setEdgeLocation] = useState(edgeUnknown);
  const [fetchError, setFetchError] = useState<Error>();
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
  const [logs, setLogs] = useState<CompositeLogEntry[]>();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        const raw = await loadCompositeLogs((percent, total, edge) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
          setEdgeLocation(edge || edgeUnknown);
        }, signal);

        setFileSize(formatBytes(raw.byteLength));
        setStep(1);

        const parser = new TriggerLogsParser(pako.inflate(new Uint8Array(raw))).parse();
        const result = parser.getCompositeLogs();

        setLogs(result);
        setStep(2);
      } catch (error) {
        setFetchError(error as Error);
        console.error(error);
      }
    };

    loadData();
    calculateCanvasWidth();

    window.addEventListener('resize', calculateCanvasWidth);

    return () => {
      controller.abort();
      window.removeEventListener('resize', calculateCanvasWidth);
    };
  }, [calculateCanvasWidth, loadedLogs]);

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {!logs && !loadedLogs.length ?
          <div style={{ padding: 20 }}><Skeleton active /></div>
          :
          !ui.sidebarCollapsed &&
          <Tabs defaultActiveKey="files" style={{ marginLeft: 20 }}>
            <TabPane tab={<FileTextOutlined />} key="files">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                composite.csv
              </PerfectScrollbar>
            </TabPane>
          </Tabs>
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          <div ref={contentRef} style={{ width: '100%', marginRight: margin }}>
            {logs
              ?
              <CompositeCanvas
                data={logs!}
                width={canvasWidth}
                height={canvasWidth * 0.4}
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
                  />
                  <Step
                    title="Decoding"
                    description="Parsing CSV"
                  />
                  <Step
                    title="Rendering"
                    description="Putting pixels on your screen"
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

export default connect(mapStateToProps)(Diagnose);
