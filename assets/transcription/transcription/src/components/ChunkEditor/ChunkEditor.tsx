// External Dependencies
import { Add, Check, Stop, PlayArrow } from "@material-ui/icons";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  GridList,
  GridListTile,
  Mark,
  Typography,
} from "@material-ui/core";

// Internal Dependencies
import ChunkCard from "../SimpleCard/ChunkCard";
import useStyles from "./ChunkEditorStyles";
import { UserContext } from "../UserProvider/UserProvider";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import useVideoPlayerController from "../VideoPlayer/Hooks/useVideoPlayerController";
import {
  useDeleteChunk,
  useDoWithChunks,
  useNewChunk,
} from "../../utils/ChunksContext/chunksActions";
import chunksContext from "../../utils/ChunksContext/chunksContext";
import IndabaButton from "../IndabaButton/IndabaButton";
import { Chunk } from "../../utils/types";
import {
  getEnclosingChunk,
  getLastEndTimeSeconds,
  getNameOf,
  hasTranscription,
} from "../../utils/chunkManipulation";
import EditChunkModal from "../EditChunkModal/EditChunkModal";
import VideoThumbnail from "../VideoPlayer/VideoThumbnail";
import BackButton from "../BackButton/BackButton";
import useConfirmBeforeAction from "../../hooks/useConfirmBeforeAction";
import ConfirmIntentModal from "../ConfirmIntentModal/ConfirmIntentModal";
import TranscriptionsModal from "../TranscriptionsModal/TranscriptionsModal";
import SkipForwardBackButtons from "../SkipForwardBackButtons/SkipForwardBackButtons";
import SimpleCard from "../SimpleCard/SimpleCard";
import ScrollToOnMount from "../ScrollToOnMount/ScrollToOnMount";
import ChunkCardContextMenu from "./ChunkCardContextMenu";
import { api_base_address } from "../../utils/getApiKey";
import CentralModal from "../CentralModal/CentralModal";
import useTimeout from "../../hooks/useTimeout";
import useThrottle from "../../hooks/useThrottle";

type ChunkEditorProps = {
  /** Action to do when back button is pressed */
  atExit: () => void;
  story_id: string;
};

/**
 * Helper function that converts a list of chunks
 * to a list of marks
 *
 * @param chunks the chunks to get the marks for
 */
const getMarks = (chunks: Chunk[]): Mark[] =>
  chunks.map((chunk) => ({
    value: chunk.endtimeseconds * 100,
  }));

const ChunkEditor: React.FC<ChunkEditorProps> = ({ atExit, story_id }) => {
  const [chunks] = chunksContext.useChunksState();

  const {
    progressState: videoPlayerProgressState,
    playingState,
    duration,
    controller: videoPlayerController,
    playerRef
  } = useVideoPlayerController();

  const {progress, setProgress, setProgressWithVideoUpdate} = videoPlayerProgressState

  const [, setPlay] = playingState;

  const marks = useMemo(() => getMarks(chunks), [chunks]);

  const { userName } = useContext(UserContext);

  const doWithChunks = useDoWithChunks();
  const deleteChunk = useDeleteChunk();
  const newChunk = useNewChunk();

  const classes = useStyles();

  const [playingChunk, setPlayingChunk] = useState<undefined | number>(
    undefined
  );

  useEffect(() => {
    if (
      playingChunk !== undefined &&
      progress > chunks[playingChunk].endtimeseconds
    ) {
      setPlayingChunk(undefined);
      setPlay(false);
    }
  }, [progress, playingChunk, chunks]);

  const handleChunkPlayButtonClick = useCallback(
    (
      chunkIdx: number,
      playingChunk: number | undefined,
      videoPlaying: boolean
    ) => {
      if (playingChunk === chunkIdx && videoPlaying) {
        setPlay(false);
      } else {
        setPlay(true);
        setPlayingChunk(chunkIdx);
        setProgressWithVideoUpdate(chunks[chunkIdx].starttimeseconds);
      }
    },
    [chunks]
  );

  const [croppingChunk, setCroppingChunk] = useState<number | undefined>(
    undefined
  );

  const handleCompleteChunking = () => {
    getLastEndTimeSeconds(chunks) !== 1 &&
      userName &&
      newChunk(1, duration, userName);
    atExit();
  };

  const createNewChunk = (
    _: Chunk[],
    splitAt: number,
    storyDuration: number,
    userName: string
  ) => newChunk(splitAt, storyDuration, userName);

  const {
    attemptAction: attemptNewChunk,
    ...attemptNewChunkActionControls
  } = useConfirmBeforeAction(createNewChunk, (chunks, time) => {
    const enclosingChunk = getEnclosingChunk(chunks, time);
    return enclosingChunk !== undefined && hasTranscription(enclosingChunk);
  });

  const handleNewChunk = () => {
    if (userName) {
      attemptNewChunk(chunks, progress, duration, userName);
    }
  };

  const {
    attemptAction: attemptToDeleteChunk,
    ...attemptDeleteActionControls
  } = useConfirmBeforeAction(deleteChunk, (chunk) => hasTranscription(chunk));

  const [showTranscriptionsFor, setShowTranscriptionsFor] = useState<
    Chunk | undefined
  >(undefined);

  const handleAttemptDeleteChunk = (c: Chunk) => {
    doWithChunks((chunks: Chunk[]) => {
      chunks.forEach(
        (chunk) => chunk.id === c.id && attemptToDeleteChunk(chunk)
      );
    });
  };

  const [showIntroductionModal, setShowIntroductionModal] = useState(true);
  const playButtonStyle = useMemo(
    () => ({
      marginRight: "4px",
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      opacity: 0.8,
    }),
    []
  );

  const playButtonClickHandler = useCallback(
    (idx) => handleChunkPlayButtonClick(idx, playingChunk, playingState[0]),
    [playingChunk]
  );

  return (
    /* The 'http://localhost:8845' part of the url below is temporary, and not needed in production*/
    <Box>
      <div style={{ marginTop: "4px" }}>
        <BackButton action={atExit} />
      </div>
      <CentralModal
        header={<h2 style={{ margin: 0 }}>Chunking Instructions</h2>}
        open={showIntroductionModal}
        exit={() => setShowIntroductionModal(false)}
      >
        <div style={{ padding: "0px 8px 16px 8px" }}>
          You are about to chunk the video. The aim of chunking is to make
          Transcribing easy. <br />
          To create a chunk, press the '+' button in the bottom right corner.
          The time that you press the '+' button in the video will be the end of
          the new chunk. <br />
          You should aim to have only one person speaking in each chunk. Create
          a new chunk when there is a change in who is talking, there is a gap
          in the talking, or a person begins/ends talking.
        </div>
      </CentralModal>
      <EditChunkModal
        shown={croppingChunk !== undefined}
        chunk={chunks[croppingChunk ? croppingChunk : 0]}
        exit={() => setCroppingChunk(undefined)}
        storyDuration={duration}
      />
      <ConfirmIntentModal
        actionControls={attemptDeleteActionControls}
        warningMessage={<div>This Chunk has a transcription</div>}
      >
        {(...args) => (
          <div>
            Attempting to delete chunk
            {args[0] && ` "${getNameOf(args[0])}"`}, which has a transcription
            saved to it. Are you sure you want to delete it?
          </div>
        )}
      </ConfirmIntentModal>
      <ConfirmIntentModal
        actionControls={attemptNewChunkActionControls}
        warningMessage={<div>The enclosing chunk has a transcription</div>}
      >
        {(...args) => (
          <div>
            Creating a new chunk here will delete the transcriptions on the
            enclosing chunk, "
            {getNameOf(getEnclosingChunk(args[0], args[1]) ?? args[0][0])}
            ". Are you sure you want to discard these transcriptions?
          </div>
        )}
      </ConfirmIntentModal>
      <TranscriptionsModal
        chunk={showTranscriptionsFor}
        exit={() => setShowTranscriptionsFor(undefined)}
      />
      <div className={classes.videoPlayerContainer}>
        <VideoPlayer
          controller={videoPlayerController}
          progressState={videoPlayerProgressState}
          playerRef={playerRef}
          url={`http://${api_base_address}:8845/api/watch/getvideo/${story_id}`}
          sliderMarks={marks}
          onProgressDrag={() => setPlayingChunk(undefined)}
        />
      </div>
      <GridList className={classes.chunksList} cellHeight="auto" cols={2.5}>
        {chunks
          .map((c, idx) => (
            <GridListTile key={c.id}>
              <ScrollToOnMount>
                <ChunkCard
                  chunk={c}
                  transcriptionIcon={
                    <ChunkCardContextMenu
                      menuItems={[
                        {
                          content: "Delete",
                          handler: () => handleAttemptDeleteChunk(c),
                        },
                        {
                          content: "Edit",
                          handler: () => setCroppingChunk(idx),
                        },
                      ].concat(
                        c.transcriptions.length !== 0
                          ? [
                              {
                                content: "View Transcriptions",
                                handler: () => setShowTranscriptionsFor(c),
                              },
                            ]
                          : []
                      )}
                    />
                  }
                >
                  <div style={{ marginTop: "8px", position: "relative" }}>
                    <VideoThumbnail
                      url={`http://${api_base_address}:8845/api/watch/getvideo/${story_id}`}
                      time={
                        c.starttimeseconds +
                        (c.endtimeseconds - c.starttimeseconds) / 2
                      }
                    />
                    <IndabaButton
                      round
                      color="primary"
                      style={playButtonStyle as React.CSSProperties}
                      onClick={() => playButtonClickHandler(idx)}
                    >
                      {playingChunk === idx && playingState[0] ? (
                        <Stop />
                      ) : (
                        <PlayArrow />
                      )}
                    </IndabaButton>
                  </div>
                </ChunkCard>
              </ScrollToOnMount>
            </GridListTile>
          ))
          .concat(
            getLastEndTimeSeconds(chunks) > 0.75
              ? [
                  <GridListTile
                    key="Done Card"
                    onClick={handleCompleteChunking}
                  >
                    {/* <ScrollToOnMount style={{ height: "100%" }}> */}
                    <SimpleCard
                      contentStyle={{
                        backgroundColor: "#40bf11C9",
                        height: "100%",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "white",
                      }}
                      cardStyle={{
                        margin: "8px",
                        transform: "translateY(8px)",
                        height: "calc(100% - 16px)",
                      }}
                    >
                      <Check fontSize="large" style={{ marginRight: "4px" }} />
                      <Typography
                        variant="h5"
                        component="h2"
                        style={{ transform: "translateY(2px)" }}
                      >
                        Done
                      </Typography>
                    </SimpleCard>
                    {/* </ScrollToOnMount> */}
                  </GridListTile>,
                ]
              : []
          )}
      </GridList>
      <div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
          }}
        >
          <SkipForwardBackButtons
            skipForward={useCallback(
              () =>
                duration && setProgressWithVideoUpdate((progress) => progress + 5 / duration),
              [duration]
            )}
            skipBackward={useCallback(
              () =>
                duration && setProgressWithVideoUpdate((progress) => progress - 5 / duration),
              [duration]
            )}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            margin: "16px 16px 32px 16px",
            display: "flex",
          }}
        >
          <IndabaButton
            round
            aria-label="New Chunk"
            style={{ margin: "8px" }}
            onClick={handleNewChunk}
          >
            <Add />
          </IndabaButton>
        </div>
      </div>
    </Box>
  );
};

export default ChunkEditor;
