// External Dependencies
import React, { useMemo, useState, useCallback, useEffect } from "react";

/**
 * Consistent Done Buttons
 * Consistent Iconography/Typography
 * When editing transcription in review component, list other transcriptions
 * Fix bugs
 * Merge into main application
 */

// Internal Dependencies
import ChunkEditor from "../ChunkEditor/ChunkEditor";
import Dashboard from "../Dashboard/Dashboard";
import Header from "../Header/Header";
import useSteps from "./hooks/useSteps";
import View from "./Views";
import { useStoryId } from "../../utils/getId";
import Transcriber from "../Transcriber/Transcriber";
import UserProvider from "../UserProvider/UserProvider";
import useOurstoryApi from "./hooks/useOurstoryApi";
import { Reviewer } from "../Reviewer/Reviewer";
import chunksContext from "../../utils/ChunksContext/chunksContext";
import {
  countChunksWithTranscription,
  countReviewedChunks,
  getLastEndTimeSeconds,
} from "../../utils/chunkManipulation";
import useToggle from "../../hooks/useToggle";
import ContributerListModal from "../ContributersModal/ContributersModal";
import useLocalStorage from "../../hooks/useLocalStorage";

const App: React.FC<{}> = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const { ChunksProvider } = chunksContext;

  const story_id = useStoryId();

  const {
    storyTitle,
    chunksState: [chunks, setChunks],
  } = useOurstoryApi(story_id);

  const chunkingProgress = useMemo(() => getLastEndTimeSeconds(chunks), [
    chunks,
  ]);
  const transcriptionProgress = useMemo(
    () =>
      chunks.length ? countChunksWithTranscription(chunks) / chunks.length : 0,
    [chunks]
  );
  const reviewProgress = useMemo(
    () => (chunks.length ? countReviewedChunks(chunks) / chunks.length : 0),
    [chunks]
  );

  const steps = useSteps(setView, [
    { progress: chunkingProgress * 100, enabled: true },
    {
      progress: transcriptionProgress * 100,
      enabled: chunkingProgress > 0,
    },
    {
      progress: reviewProgress * 100,
      enabled: transcriptionProgress > 0,
    },
  ]);

  const [showContributers, toggleShowContributers] = useToggle(false);

  const [
    showChunkEditorOnboarding,
    setShowChunkEditorOnboarding,
  ] = useLocalStorage("showChunkEditorOnboardingModal", "true");
  const [
    showTranscriberOnboarding,
    setShowTranscriberOnboarding,
  ] = useLocalStorage("showTranscriberOnboardingModal", "true");

  const [showReviewerOnboardring, setShowReviewerOnboarding] = useLocalStorage(
    "showReviewerOnboardingModal",
    "true"
  );

  const logOutAction = () => {
    setShowChunkEditorOnboarding("true");
    setShowTranscriberOnboarding("true");
    setShowReviewerOnboarding("true");
  };

  const exit = useCallback(() => setView(View.Dashboard), []);

  const contextMenuItems = useMemo(
    () =>
      [
        {
          content: <div>Show Contributions</div>,
          handler: toggleShowContributers,
        }
      ].concat(
        view === View.Chunking
          ? {
              content: <div>View instructions</div>,
              handler: (): void => {
                setShowChunkEditorOnboarding("true");
              },
            }
          : view === View.Reviewing
          ? {
              content: <div>View instructions</div>,
              handler: (): void => {
                setShowReviewerOnboarding("true");
              },
            }
          : []
      ),
    [
      view,
      setShowChunkEditorOnboarding,
      setShowReviewerOnboarding,
      toggleShowContributers,
    ]
  );

  return (
    <ChunksProvider state={[chunks, setChunks]}>
      <UserProvider>
        <main>
          <ContributerListModal
            chunks={chunks}
            show={showContributers}
            exit={toggleShowContributers}
          />
          <Header
            title={View[view]}
            hidden={view === View.Transcribing}
            contextMenuItems={contextMenuItems}
          >
            {view === View.Dashboard ? (
              <Dashboard
                steps={steps}
                storyName={storyTitle ? storyTitle : "Loading"}
                logOutAction={logOutAction}
              />
            ) : view === View.Chunking ? (
              <ChunkEditor
                story_id={story_id}
                atExit={exit}
                onboarding={{
                  showOnboardingModal: showChunkEditorOnboarding === "true",
                  dismissOnboardingModal: () =>
                    setShowChunkEditorOnboarding("false"),
                }}
              />
            ) : view === View.Transcribing ? (
              <Transcriber
                story_id={story_id}
                atExit={exit}
                onboarding={{
                  showOnboardingModal: showTranscriberOnboarding === "true",
                  dismissOnboardingModal: () =>
                    setShowTranscriberOnboarding("false"),
                }}
              />
            ) : view === View.Reviewing ? (
              <Reviewer
                atExit={exit}
                story_id={story_id}
                onboarding={{
                  showOnboardingModal: showReviewerOnboardring === "true",
                  dismissOnboardingModal: () =>
                    setShowReviewerOnboarding("false"),
                }}
              />
            ) : null}
          </Header>
        </main>
      </UserProvider>
    </ChunksProvider>
  );
};

export default App;
