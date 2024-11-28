import { PropsWithChildren } from "react";

type Sortable = {
  enabled: boolean;
  handle?: boolean;
  handleIcon?: React.ReactNode;
};

type OnChangeOrder = (id: number[]) => void;

export interface SortableListProps extends PropsWithChildren {
  className?: string;
  sortable?: Sortable;
  onChangeOrder: OnChangeOrder;
}

export interface SortableItemProps extends PropsWithChildren {
  id: number;
  sortable: Sortable;
}
