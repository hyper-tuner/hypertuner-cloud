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

// TODO: extract this to types package
interface CompositeLogEntry {
  type: 'trigger' | 'marker';
  primaryLevel: number;
  secondaryLevel: number;
  trigger: number;
  sync: number;
  refTime: number;
  maxTime: number;
  toothTime: number;
  time: number;
}

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

        const buff = pako.inflate(new Uint8Array(raw));
        const string = (new TextDecoder()).decode(buff);
        const result: CompositeLogEntry[] = [];

        setStep(1);

        // TODO: extract this, make a parser class
        string.split('\n').forEach((line, index) => {
          const trimmed = line.trim();

          // skip comments
          if (trimmed.startsWith('#')) {
            return;
          }

          // markers
          if (trimmed.startsWith('MARK')) {
            const previous = result[result.length - 1] || {
              primaryLevel: 0,
              secondaryLevel: 0,
              trigger: 0,
              sync: 0,
              refTime: 0,
              maxTime: 0,
              toothTime: 0,
              time: 0,
            };

            result.push({
              type: 'marker',
              primaryLevel: previous.primaryLevel,
              secondaryLevel: previous.secondaryLevel,
              trigger: previous.trigger,
              sync: previous.sync,
              refTime: previous.refTime,
              maxTime: previous.maxTime,
              toothTime: previous.toothTime,
              time: previous.time,
            });
          }

          const split = trimmed.split(',');
          if (!isNumber(split[0])) {
            return;
          }

          const time = Number(split[7]);
          if (!time) {
            return;
          }

          result.push({
            type: 'trigger',
            primaryLevel: Number(split[0]),
            secondaryLevel: Number(split[1]),
            trigger: Number(split[2]),
            sync: Number(split[3]),
            refTime: Number(split[4]),
            maxTime: Number(split[5]),
            toothTime: Number(split[6]),
            time,
          });
        });

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
