import { Pagination } from 'antd';
import { ReactNode, useState } from 'react';

interface LogsPaginationProps {
  children: ReactNode;
  total: number;
  pageSize: number;
  onChange: (indexFrom: number, indexTo: number) => void;
}

const LogsPagination = (props: LogsPaginationProps) => {
  const [page, setPage] = useState(1);
  const { children, total, pageSize, onChange } = props;

  const changePage = (newPage: number) => {
    setPage(newPage);
    const indexFrom = (newPage - 1) * pageSize;
    const indexTo = indexFrom + pageSize;
    onChange(indexFrom, indexTo);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 3, right: 5, zIndex: 1 }}>
        <Pagination
          simple={true}
          defaultPageSize={pageSize}
          current={page}
          total={total}
          onChange={changePage}
        />
      </div>
      {children}
    </div>
  );
};

export default LogsPagination;
