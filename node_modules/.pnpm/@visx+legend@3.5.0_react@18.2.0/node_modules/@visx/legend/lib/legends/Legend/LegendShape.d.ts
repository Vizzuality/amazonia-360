/// <reference types="react" />
import { FillAccessor, FormattedLabel, LegendShape as LegendShapeType, SizeAccessor, ShapeStyleAccessor } from '../../types';
export declare type LegendShapeProps<Data, Output> = {
    label: FormattedLabel<Data, Output>;
    item: Data;
    itemIndex: number;
    margin?: string | number;
    shape?: LegendShapeType<Data, Output>;
    fill?: FillAccessor<Data, Output>;
    size?: SizeAccessor<Data, Output>;
    shapeStyle?: ShapeStyleAccessor<Data, Output>;
    width?: string | number;
    height?: string | number;
};
export default function LegendShape<Data, Output>({ shape, width, height, margin, label, item, itemIndex, fill, size, shapeStyle, }: LegendShapeProps<Data, Output>): JSX.Element;
//# sourceMappingURL=LegendShape.d.ts.map