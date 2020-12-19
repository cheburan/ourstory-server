import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  videoPlayerContainer: {
    width: "80vw",
    height: "80vh",
    margin: "auto",
    marginTop: "4vh",
  },
  chunksContainer: {
    display: "flex",
    flexDirection: "row",
  },
  actionButton: {
    '&:hover': {
        background: "#d9534f",
     },
  }
});

export default useStyles;
