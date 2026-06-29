import re

with open('src/features/objects/ObjectRenderers.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:628]

equipment_code = """
// ---------- Equipment ----------
type AnyEquipment = ConeObject | LadderObject | MiniGoalObject | MannequinObject;

function getEquipmentColor(type: AnyEquipment['type']): string {
  switch (type) {
    case 'cone': return '#f59e0b';
    case 'ladder': return '#8b5cf6';
    case 'mini_goal': return '#6b7280';
    case 'mannequin': return '#ef4444';
  }
}

export const EquipmentRenderer: React.FC<BaseRenderProps<AnyEquipment>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onTransformEnd, onClick }) => {
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    const color = getEquipmentColor(obj.type);

    const renderEquipmentShape = () => {
      switch (obj.type) {
        case 'cone':
          return (
            <Group y={-6}>
              {/* Shadow */}
              <Ellipse radiusX={10} radiusY={4} y={12} fill="black" opacity={0.3} />
              {/* Cone Body */}
              <RegularPolygon
                sides={3}
                radius={12}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
                shadowBlur={2}
                shadowColor="rgba(0,0,0,0.3)"
                shadowOffsetY={1}
              />
              <Line points={[-6, 4, 6, 4]} stroke="#ffffff" strokeWidth={2} opacity={0.8} />
            </Group>
          );
        case 'ladder':
          return (
            <Group>
              <Rect x={-8} y={-24} width={16} height={48} fill="#ffffff" opacity={0.1} />
              <Line points={[-8, -24, -8, 24]} stroke={color} strokeWidth={2} />
              <Line points={[8, -24, 8, 24]} stroke={color} strokeWidth={2} />
              {[-18, -6, 6, 18].map((ry, i) => (
                <Line key={i} points={[-8, ry, 8, ry]} stroke={color} strokeWidth={2} />
              ))}
            </Group>
          );
        case 'mini_goal':
          return (
            <Group>
              {/* Net area */}
              <Rect x={-15} y={-8} width={30} height={16} fill="#ffffff" opacity={0.15} dash={[2, 2]} stroke="#ffffff" strokeWidth={1} />
              {/* Goalposts */}
              <Line points={[-15, 8, -15, -8, 15, -8, 15, 8]} stroke={color} strokeWidth={3} lineCap="round" lineJoin="round" />
            </Group>
          );
        case 'mannequin':
          return (
            <Group>
              <Ellipse radiusX={14} radiusY={4} y={16} fill="black" opacity={0.3} />
              {/* Shoulders */}
              <Rect x={-12} y={-2} width={24} height={18} fill={color} stroke="#ffffff" strokeWidth={2} cornerRadius={6} />
              {/* Head */}
              <Circle y={-10} radius={7} fill={color} stroke="#ffffff" strokeWidth={2} />
            </Group>
          );
      }
    };

    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={(obj as any)._opacity ?? 1}
        draggable={!obj.locked}
        onDragEnd={(e) => onDragEnd(obj.id, e.target.x(), e.target.y())}
        onTransformEnd={(e) => {
          const node = e.target;
          node.scaleX(1);
          node.scaleY(1);
          if (onTransformEnd) {
            onTransformEnd(obj.id, {
              rotation: Math.round(node.rotation()),
            });
          }
        }}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={() => onClick(obj.id, false)}
        hitStrokeWidth={30}
        id={obj.id}
      >
        {/* Selection Ring */}
        {isSelected && (
          <Circle 
            radius={20} 
            stroke="#eab308" 
            strokeWidth={2} 
            dash={[4, 4]}
            opacity={0.8}
            listening={false} 
          />
        )}

        {renderEquipmentShape()}
      </Group>
    );
  }
);
EquipmentRenderer.displayName = 'EquipmentRenderer';
"""

with open('src/features/objects/ObjectRenderers.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    f.write(equipment_code)

print("File fixed!")
