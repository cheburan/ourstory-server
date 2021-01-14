import { Box, Button, Mark, Slider, Typography } from "@material-ui/core";
import { Pause, PlayArrow } from "@material-ui/icons";
import React, { useRef } from "react";
import ReactPlayer from "react-player";
import useDefaultState from "../../hooks/useDefaultState";
import { toShortTimeStamp } from "../../utils/chunkManipulation";
import { State } from "../../utils/types";
import useVideoPlayerProps from "./Hooks/useVideoPlayerProps";
import { ProgressState, SplitState } from "./Hooks/useVideoPlayerState";
import ProgressBarLabel from "./ProgressBarLabel";
import useStyles from "./VideoPlayerStyles";

export type VideoPlayerControllerType = {
  progressState: State<ProgressState>;
  durationState: State<number>;
  playingState: State<boolean>;
  splitState: State<SplitState>;
};

export type VideoPlayerProps = {
  /**
   * The user of the VideoPlayer component has the option to control the
   * player, to do so, they need to provide a controller object which has
   * the state the component requires
   */
  controller?: VideoPlayerControllerType;
  /**
   * The url of the video
   */
  url: string;
  sliderMarks?: Mark[];
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  controller,
  sliderMarks,
}) => {
  const classes = useStyles();
  const playerRef = useRef<ReactPlayer>(null);
  const [duration, setDuration] = useDefaultState(
    controller ? controller.durationState : null,
    0
  );
  const [progress, setProgress] = useDefaultState(
    controller ? controller.progressState : null,
    { progress: 0, fromPlayer: false }
  );
  const playState = useDefaultState(
    controller ? controller.playingState : null,
    false
  );
  const [split] = useDefaultState(controller ? controller.splitState : null, {
    start: 0,
    end: 1,
  });

  const {
    playerProps,
    progressBarProps,
    showControls,
    isPlaying,
    toggleIsPlaying,
  } = useVideoPlayerProps(
    [progress, setProgress],
    playState,
    playerRef,
    setDuration,
    split
  );

  return (
    <Box className={classes.videoPlayerContainer}>
      <ReactPlayer
        url={url}
        ref={playerRef}
        width="100%"
        height="100%"
        {...playerProps}
      />
      {showControls && (
        <>
          {/* Play/Pause Button */}
          <Button
            variant="contained"
            color="primary"
            className={classes.videoPlayerPlayButton}
            onClick={toggleIsPlaying}
          >
            {(isPlaying && <Pause fontSize="large" />) || (
              <PlayArrow fontSize="large" />
            )}
          </Button>
          <div className={classes.progressBarContainer}>
            {/* Progress Bar */}
            <Typography
              variant="caption"
              style={{ margin: "8px", color: "#FFFFFF" }}
            >
              {duration &&
                `${toShortTimeStamp(
                  (progress.progress - split.start) * duration
                )} / ${toShortTimeStamp((split.end - split.start) * duration)}`}
            </Typography>
            <Slider
              classes={{
                colorPrimary: classes.progressBarColor,
                root: classes.progressBarRoot,
                rail: classes.progressBarRail,
                track: classes.progressBarTrack,
                thumb: classes.progressBarThumb,
                mark: classes.progressBarMark
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(progress) => toShortTimeStamp(progress / 100 * duration)}
              ValueLabelComponent={ProgressBarLabel}
              marks={sliderMarks ? sliderMarks : []}
              {...progressBarProps}
            />
          </div>
        </>
      )}
    </Box>
  );
};

export default VideoPlayer;
