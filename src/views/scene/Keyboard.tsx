import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  LoopOnce,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";
import { RootState } from "../../reducers/store";
import { keyActions } from "../../constants/keyActions";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import OrbitronRegular from "/fonts/Agitpropc.otf";
import { TextGeometry } from "three/examples/jsm/Addons.js";

function Keyboard() {
  // TODO Find a way to correctly type the useRef for a R3F group
  const groupRef = useRef<any>();
  const { nodes, scene, animations } = useGLTF("/models/keyboard.glb");
  const { actions } = useAnimations(animations, groupRef);
  const { colors, settings } = useSelector((state: RootState) => state);

  // Define the mapping between colors state properties and target keys
  const colorMapping = {
    keys: "key",
    letters: "text",
    caseTop: "top",
    caseBottom: "bottom",
  } as const;

  // Update a specific node color
  const updateNodeColor = (id: string, material: MeshStandardMaterial) => {
    const node = scene.getObjectByName(id) as Mesh | null;
    if (node) {
      node.material = material;
    } else {
      console.warn(`Node with id ${id} not found in the scene.`);
    }
  };

  const updateGroupNodeColor = (
    target: "key" | "text" | "top" | "bottom",
    color: string
  ) => {
    const nodesId = Object.keys(nodes).filter((key) =>
      key.includes(`_${target}`)
    );
    const material = new MeshPhysicalMaterial({
      color,
      roughness: 1,
      metalness: 0.5,
    });
    nodesId.forEach((id) => updateNodeColor(id, material));
  };

  const updateFont = () => {
    const nodesId = Object.keys(nodes).filter((key) => key.includes("_text"));
    const loader = new FontLoader();
    nodesId.forEach((id) => {
      const node = scene.getObjectByName(id) as Mesh;
      console.log(node);

      loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json", (font) => {
        const textGeometry = node.geometry as TextGeometry; 
        const newTextGeometry = new TextGeometry("node.userData.text", {
          font: font,
          size: 1,
          height: 1,
        });

        // node.geometry = newTextGeometry;
      });
    });
  };

  updateFont();

  // Play a specific animation
  const playAnimation = (animation: string) => {
    actions[animation]?.setLoop(LoopOnce, 1);
    actions[animation]?.play().reset();
  };

  // Key down listener
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = keyActions[event.code];
      if (action) {
        playAnimation(action.animation);
        if (settings.keyTestMode) {
          updateNodeColor(
            action.node,
            new MeshStandardMaterial({ color: "green" })
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settings]);

  // Update nodes color when a color is updated
  useEffect(() => {
    Object.keys(colors).forEach((key) => {
      const target = key as keyof typeof colors;
      updateGroupNodeColor(colorMapping[target], colors[target]);
    });
  }, [colors]);

  // Reset keys color on turning off the key test mode
  useEffect(() => {
    if (settings.keyTestMode === false) {
      updateGroupNodeColor("key", colors.keys);
    }
  }, [settings.keyTestMode]);

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        position={[0, 0, 0]}
        rotation={[0, 1.77, 1.2]}
      />
    </group>
  );
}

export default Keyboard;
