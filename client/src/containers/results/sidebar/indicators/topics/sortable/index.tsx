"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  arrayMove,
  // SortableContext,
  sortableKeyboardCoordinates,
  // verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableItem from "./item";
import { SortableListProps } from "./types";

export const SortableList: React.FC<SortableListProps> = ({
  children,
  sortable = { enabled: true },
  onChangeOrder,
}: SortableListProps) => {
  const uid = useId();
  const [activeId, setActiveId] = useState<number | null>(null);

  const ActiveItem = useMemo(() => {
    const activeChildArray = Children.map(children, (Child) => {
      if (isValidElement(Child)) {
        const { props } = Child as ReactElement<unknown>;
        const { id } = props as { id: number };

        if (id === activeId) {
          return Child;
        }
        return null;
      }
      return null;
    });

    return activeChildArray?.[0] || null;
  }, [children, activeId]);

  const itemsIds = (
    Children.map(children, (Child) => {
      if (isValidElement(Child)) {
        const { props } = Child as ReactElement<unknown>;
        const { id } = props as { id: number };
        return id;
      }
      return null;
    }) || []
  ).filter((id): id is number => id !== null && id !== undefined);

  const sensors = useSensors(
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0.5,
        tolerance: 10,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (!active) return;
    setActiveId(active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (active.id !== over?.id) {
        const oldIndex = itemsIds?.indexOf(active.id as number);
        const newIndex = itemsIds?.indexOf(over?.id as number);

        if (onChangeOrder && itemsIds && oldIndex !== undefined && newIndex !== undefined) {
          onChangeOrder(arrayMove(itemsIds, oldIndex, newIndex));
        }
      }
    },
    [itemsIds, onChangeOrder],
  );

  return (
    <DndContext
      id={uid}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {Children.map(children, (Child) => {
        if (isValidElement(Child)) {
          const { props } = Child as ReactElement<unknown>;
          const { id } = props as { id: number };

          return (
            <SortableItem id={id} sortable={sortable}>
              {cloneElement(
                Child as ReactElement<{
                  sortable?: typeof sortable;
                }>,
                {
                  sortable,
                },
              )}
            </SortableItem>
          );
        }
        return null;
      })}

      <DragOverlay>
        {isValidElement(ActiveItem) && (
          <div className="flex max-h-[calc(100vh_-_theme(space.16)_-_theme(space.6)_-_theme(space.48)_-_theme(space.40))] flex-col overflow-hidden">
            {cloneElement(
              ActiveItem as ReactElement<{
                sortable?: typeof sortable;
              }>,
              {
                sortable,
              },
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default SortableList;
