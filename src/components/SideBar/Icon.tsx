import {
  ApartmentOutlined,
  ApiOutlined,
  CarOutlined,
  ControlOutlined,
  DashboardOutlined,
  DotChartOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FireOutlined,
  FundOutlined,
  FundProjectionScreenOutlined,
  PoweroffOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  SettingOutlined,
  TableOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UpCircleOutlined,
} from '@ant-design/icons';

const Icon = ({ name }: { name: string }): JSX.Element => {
  const map: { [index: string]: JSX.Element } = {
    settings: <ControlOutlined />,
    tuning: <CarOutlined />,
    spark: <FireOutlined />,
    startupIdle: <PoweroffOutlined />,
    accessories: <ApiOutlined />,
    tools: <ToolOutlined />,
    '3dTuningMaps': <DotChartOutlined />,
    hardwareTesting: <ExperimentOutlined />,
    help: <QuestionCircleOutlined />,
    injChars: <FundOutlined />,
    airdensity_curve: <FundOutlined />,
    baroFuel_curve: <FundOutlined />,
    dwellCompensation: <FundOutlined />,
    iatRetard: <FundOutlined />,
    clt_advance_curve: <FundOutlined />,
    rotary_ignition: <FundOutlined />,
    accelEnrichments: <FundOutlined />,
    flexFueling: <FundOutlined />,
    dwell_correction_curve: <FundOutlined />,
    iat_retard_curve: <FundOutlined />,
    crankPW: <FundOutlined />,
    primePW: <FundOutlined />,
    warmup: <FundOutlined />,
    ASE: <FundOutlined />,
    iacClosedLoop_curve: <FundOutlined />,
    iacPwm_curve: <FundOutlined />,
    iacPwmCrank_curve: <FundOutlined />,
    iacStep_curve: <FundOutlined />,
    iacStepCrank_curve: <FundOutlined />,
    idleAdvanceSettings: <FundOutlined />,
    sparkTbl: <TableOutlined />,
    veTableDialog: <TableOutlined />,
    afrTable1Tbl: <TableOutlined />,
    fuelTable2Dialog: <TableOutlined />,
    sparkTable2Dialog: <TableOutlined />,
    inj_trimad: <TableOutlined />,
    stagingTableDialog: <TableOutlined />,
    stagedInjection: <TableOutlined />,
    fuelTemp_curve: <TableOutlined />,
    boostLoad: <TableOutlined />,
    triggerSettings: <SettingOutlined />,
    reset_control: <PoweroffOutlined />,
    engine_constants: <ControlOutlined />,
    io_summary: <UnorderedListOutlined />,
    prgm_out_config: <ApartmentOutlined />,
    std_realtime: <FundProjectionScreenOutlined />,
    sparkSettings: <FireOutlined />,
    dwellSettings: <FieldTimeOutlined />,
    RevLimiterS: <SafetyOutlined />,
    idleUpSettings: <UpCircleOutlined />,
    LaunchControl: <ThunderboltOutlined />,
    NitrousControl: <RocketOutlined />,
    vssSettings: <SettingOutlined />,
    Auxin_config: <ApiOutlined />,
    tacho: <DashboardOutlined />,
    pressureSensors: <DashboardOutlined />,
  };

  let icon = <ControlOutlined />;

  Object.keys(map).forEach((key) => {
    // const current = map[key];
    if (key.toLowerCase().includes(name.toLowerCase())) {
      icon = map[key];
    }
  });

  return icon;
};

export default Icon;
