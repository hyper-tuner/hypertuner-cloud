import { Tag } from 'antd';
import { TunesTagsOptions } from '../@types/pocketbase-types';

const TuneTag = ({ tag }: { tag: TunesTagsOptions | undefined }) =>
  tag ? <Tag color={tag === TunesTagsOptions['base map'] ? 'green' : 'red'}>{tag}</Tag> : null;

export default TuneTag;
