import { Tag } from 'antd';

const TuneTag = ({ tag }: { tag: string }) => (
  tag ? <Tag color={tag === 'base map' ? 'green' : 'red'}>
    {tag}
  </Tag> : null
);

export default TuneTag;
