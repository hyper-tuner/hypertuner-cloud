import { Typography, Alert } from 'antd';

const TextField = ({ title }: { title: string }) => {
  const types: { [char: string]: 'info' | 'warning' } = {
    '#': 'info',
    '!': 'warning',
  };
  const type = types[title.charAt(0)];
  const message = type ? title.substring(1) : title;
  let messageTag = <span>{message}</span>;

  // check if message contains a link and render it as a link
  const linkRegex = /https?:\/\/[^\s]+/g;
  const linkMatch = message.match(linkRegex);
  if (linkMatch) {
    const link = linkMatch[0];
    const linkIndex = message.indexOf(link);
    const beforeLink = message.substring(0, linkIndex);
    const afterLink = message.substring(linkIndex + link.length);

    messageTag = (
      <>
        {beforeLink}
        <a href={link} target='_blank' rel='noreferrer' style={{ color: 'inherit' }}>
          {link}
        </a>
        {afterLink}
      </>
    );
  }

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
