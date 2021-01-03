// External Dependencies
import { Box, Container, IconButton, TextField } from "@material-ui/core";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";
import { v4 as uuidv4 } from "uuid";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { Frame } from "framer";
import { motion, useAnimation } from "framer-motion";

// Internal Dependencies
import useListIndexController from "../../hooks/useListIndexController";
import oneSatisfies from "../../utils/oneSatisfies";
import { Chunk, StateSetter } from "../../utils/types";
import ChunkCard from "../ChunkCard/ChunkCard";
import { UserContext } from "../UserProvider/UserProvider";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import useStyles from "./TranscriberStyles";
import useVideoPlayerController from "../VideoPlayer/Hooks/useVideoPlayerController";

const getUsersTranscription = (chunk: Chunk, userName: string): string =>
  oneSatisfies(chunk.transcriptions, (t) => t.creatorid === userName)
    ? chunk.transcriptions.filter((t) => t.creatorid === userName)[0].content
    : "";
/**
 * This function updates the chunks state, based on the current
 * state of currentChunkIndex and transcription.
 */
const updateChunk = (
  currentChunkIndex: number,
  newTranscription: string,
  userName: string,
  setChunks: StateSetter<Chunk[]>
) => {
  userName &&
    setChunks((chunks) =>
      chunks.map((c) =>
        c.id === chunks[currentChunkIndex].id
          ? {
              ...c,
              /* This call to oneSatisfies checks if the current user has
               * already made a transcription for this chunk (in that case,
               * update that chunk instead of creating a new one)
               */
              transcriptions: oneSatisfies(
                c.transcriptions,
                (t) => t.creatorid === userName
              )
                ? c.transcriptions.map((t) =>
                    t.creatorid === userName
                      ? { ...t, content: newTranscription }
                      : t
                  )
                : c.transcriptions.concat([
                    {
                      creatorid: userName,
                      content: newTranscription,
                      id: uuidv4(),
                      updatedat: new Date(),
                    },
                  ]),
            }
          : c
      )
    );
};
type TranscriberProps = {
  chunksState: [Chunk[], StateSetter<Chunk[]>];
  story_id: string;
  makeBackButton: (action: () => void) => ReactNode;
};

const Transcriber: React.FC<TranscriberProps> = ({
  chunksState,
  story_id,
  makeBackButton,
}) => {
  const [chunks, setChunks] = chunksState;

  const [split, setSplit] = useState({ start: 0, end: 1 });

  const {
    progressState: [, setProgress], controller
  } = useVideoPlayerController();

  const videoTwoAnimationControls = useAnimation();
  const videoOneAnimationControls = useAnimation();
  type ActiveVideo = "one" | "two";
  const [activeVideo, setActiveVideo] = useState<ActiveVideo>("one");
  const toggleActiveVideo = () =>
    setActiveVideo((s) => (s === "one" ? "two" : "one"));
  type VideoChange = "left" | "right";
  const ease = [0.6, 0.05, -0.01, 0.99];
  const animateVideoChange = (change: VideoChange) => {
    videoOneAnimationControls.stop();
    videoTwoAnimationControls.stop();
    (activeVideo === "one" ? videoTwoAnimationControls : videoOneAnimationControls).set({ x: change === "left" ? "-100vw" : "100vw" });
    (activeVideo === "one" ? videoOneAnimationControls : videoTwoAnimationControls).set({ x: 0 });
    (activeVideo === "one" ? videoTwoAnimationControls : videoOneAnimationControls).start({ x: 0, transition: { ease: ease } });
    (activeVideo === "one" ? videoOneAnimationControls : videoTwoAnimationControls).start({ x: change === "left" ? "100vw" : "-100vw", transition: { ease: ease } }).then(toggleActiveVideo);
  };

  const { userName } = useContext(UserContext);

  const [transcription, setTranscription] = useState("");

  const {
    currentValue: currentChunk,
    currentIndex: currentChunkIndex,
    nextIndexPossible: enableNextChunk,
    prevIndexPossible: enablePrevChunk,
    nextIndex: toNextChunk,
    prevIndex: toPrevChunk,
  } = useListIndexController(chunks);

  useEffect(() => {
    userName &&
      setTranscription(
        getUsersTranscription(chunks[currentChunkIndex], userName)
      );
    setSplit({
      start: chunks[currentChunkIndex].starttimeseconds,
      end: chunks[currentChunkIndex].endtimeseconds,
    });
    setProgress(chunks[currentChunkIndex].starttimeseconds);
  }, [chunks, currentChunkIndex, userName]);

  const backButton = makeBackButton(
    () =>
      userName &&
      updateChunk(currentChunkIndex, transcription, userName, setChunks)
  );

  const classes = useStyles();

  return (
    <Container>
      {backButton}
      {chunks.length && (
        <>
          <Box className={classes.videoPlayerContainer}>
            <motion.div animate={videoOneAnimationControls}>
              <VideoPlayer
                url={`http://localhost:8845/api/watch/getvideo/${story_id}`}
                controller={controller}
              />
            </motion.div>
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: "translateX(-100vw)",
              }}
              animate={videoTwoAnimationControls}
            >
              <VideoPlayer
                url={`http://localhost:8845/api/watch/getvideo/${story_id}`}
                controller={controller}
              />
            </motion.div>
          </Box>
          <Box className={classes.transcribeControls}>
            <IconButton
              aria-label="Previous Chunk"
              style={{ color: "#FFFFFF" }}
              disabled={!enablePrevChunk}
              onClick={() => {
                animateVideoChange("left");
                userName &&
                  updateChunk(
                    currentChunkIndex,
                    transcription,
                    userName,
                    setChunks
                  );
                toPrevChunk();
              }}
            >
              <NavigateBefore />
            </IconButton>
            <Box className={classes.transcriptionInput}>
              <ChunkCard chunk={currentChunk}>
                <TextField
                  multiline
                  className={classes.inputField}
                  variant="outlined"
                  rows={3}
                  label="Transcription"
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                />
              </ChunkCard>
            </Box>
            <IconButton
              aria-label="Next Chunk"
              style={{ color: "#FFFFFF" }}
              disabled={!enableNextChunk}
              onClick={() => {
                animateVideoChange("right");
                userName &&
                  updateChunk(
                    currentChunkIndex,
                    transcription,
                    userName,
                    setChunks
                  );
                toNextChunk();
              }}
            >
              <NavigateNext />
            </IconButton>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Transcriber;
