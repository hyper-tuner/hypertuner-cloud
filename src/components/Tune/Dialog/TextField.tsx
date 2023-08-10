import { Typography, Alert } from 'antd';

const TextField = ({ title }: { title: string }) => {
  const types: { [char: string]: 'info' | 'warning' } = {
    '#': 'info',
    '!': 'warning',
  };
  const type = types[title.charAt(0)];
  const message = type ? title.substring(1) : title;
  let messageTag = <span>{message}</span>;

  // check if message contains url and render it as a link
  const urlPattern = /(?<url>https?:\/\/[^:[\]@!$'(),; ]+)/;
  const matches = message.split(urlPattern);

  if (!matches) {
    return messageTag;
  }

  const parts = matches.map((part) => {
    if (urlPattern.test(part)) {
      return (
        <a href={part} target='_blank' rel='noreferrer' style={{ color: 'inherit' }}>
          {part}
        </a>
      );
    }

    return part;
  });

  messageTag = <span>{parts}</span>;

  return (
    <Typography.Paragraph style={{ display: 'flex', justifyContent: 'center' }}>
      {type ? (
        <Alert message={messageTag} type={type} showIcon style={{ width: '100%', maxWidth: 700 }} />
      ) : (
        <Typography.Text type='secondary'>{title}</Typography.Text>
      )}
    </Typography.Paragraph>
  );
};

export default TextField;
