import WidgetsColumn from "@/containers/widgets/column";
import WidgetMap from "@/containers/widgets/map";
import WidgetAdministrativeBoundaries from "@/containers/widgets/overview/administrative-boundaries";
import WidgetConservation from "@/containers/widgets/overview/conservation";
import WidgetIndigenous from "@/containers/widgets/overview/indigenous-lands";
import WidgetPopulation from "@/containers/widgets/overview/population";
import WidgetTotalArea from "@/containers/widgets/overview/total-area";
import WidgetsRow from "@/containers/widgets/row";

// import { Responsive, WidthProvider } from "react-grid-layout";

// import { useGetIndicatorsOverview } from "@/lib/indicators";

// import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

// import ReportResultsIndicatorOverview from "@/containers/report/results/indicator-overview";

// const ResponsiveReactGridLayout = WidthProvider(Responsive);

export default function WidgetsOverview() {
  // const { data: indicatorsOverview } = useGetIndicatorsOverview();

  return (
    <div className="container">
      <WidgetsRow>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetTotalArea />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetPopulation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetConservation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetIndigenous />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12">
          <WidgetMap
            ids={["ciudades_capitales"]}
            popup={{
              dockEnabled: true,
              dockOptions: {
                buttonEnabled: false,
                breakpoint: false,
                position: "bottom-right",
              },
              visibleElements: {
                featureNavigation: false,
              },
              viewModel: {
                includeDefaultActions: false,
                features: [],
              },
              collapseEnabled: false,
            }}
          />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12">
          <WidgetAdministrativeBoundaries />
        </WidgetsColumn>
      </WidgetsRow>

      {/* <div className="space-y-20">
        <ResponsiveReactGridLayout
          className="layout animated"
          cols={{ lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 }}
          rowHeight={122}
          containerPadding={[0, 0]}
          isDraggable={false}
          isResizable={false}
          resizeHandles={["sw", "nw", "se", "ne"]}
          resizeHandle={false}
          compactType="horizontal"
        >
          {indicatorsOverview?.map((indicator) => {
            const dataGridConfig = {
              x: indicator.visualization.x ?? 0,
              y: indicator.visualization.y ?? 0,
              w: indicator.visualization.w,
              h: indicator.visualization.h,
              minW: MIN_VISUALIZATION_SIZES[indicator.visualization.type]?.w ?? 1,
              minH: MIN_VISUALIZATION_SIZES[indicator.visualization.type]?.h ?? 1,
            };

            return (
              <div
                key={`indicator-${indicator.id}-${indicator.visualization.type}`}
                id={`${indicator.id}-${indicator.visualization.type}`}
                className="flex h-full flex-col"
                data-grid={dataGridConfig}
              >
                <ReportResultsIndicatorOverview
                  {...indicator}
                  type={indicator.visualization.type}
                />
              </div>
            );
          })}
        </ResponsiveReactGridLayout>
      </div> */}
    </div>
  );
}
