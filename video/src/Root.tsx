import { Composition, Folder } from "remotion";
import { CourseOpening, Opening, EvidenceCard } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CourseOpening"
        component={CourseOpening}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="OpeningScene"
          component={Opening}
          durationInFrames={450}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
      <Folder name="Elements">
        <Composition
          id="EvidenceCard"
          component={EvidenceCard}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "为什么做",
            label: "01 / ISSUE",
            accent: "#b5a5ef",
            style: { position: "absolute", left: 160, top: 400 },
          }}
        />
      </Folder>
    </>
  );
};
