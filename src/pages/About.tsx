import { Button, Result } from 'antd';
import { HeartOutlined, GithubOutlined } from '@ant-design/icons';
import hyperIcon from '../assets/img/hypertuner-logo.png';

const About = () => (
  <div className='large-container'>
    <Result
      status='success'
      icon={<img src={hyperIcon} alt='HyperTuner' style={{ maxWidth: 100 }} />}
      title={
        <>
          Powered by{' '}
          <a href='https://github.com/hyper-tuner' target='_blank' rel='noreferrer'>
            HyperTuner
          </a>
        </>
      }
      subTitle={
        <>
          Created with <HeartOutlined /> by{' '}
          <a href='https://github.com/karniv00l' target='_blank' rel='noreferrer'>
            Piotr Rogowski
          </a>
          , licensed under{' '}
          <a
            href='https://github.com/hyper-tuner/hypertuner-cloud/blob/master/LICENSE'
            target='_blank'
            rel='noreferrer'
          >
            MIT
          </a>
          .
        </>
      }
      extra={[
        <Button
          type='primary'
          key='sponsor'
          className='sponsor-button'
          icon={<HeartOutlined />}
          onClick={() => window.open('https://github.com/sponsors/karniv00l', '_blank')}
        >
          Sponsor
        </Button>,
        <Button
          key='source'
          icon={<GithubOutlined />}
          onClick={() => window.open('https://github.com/hyper-tuner/hypertuner-cloud', '_blank')}
        >
          Source
        </Button>,
      ]}
    />
  </div>
);

export default About;
