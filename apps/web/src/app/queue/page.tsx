"use client";

import {
  Box,
  Typography,
  Button,
  Snackbar,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatch } from "@/hooks/useMatch";
import { ReadyState } from "@/lib/socket";
import MatchDialog from "@/components/ui/MatchDialog";
import {SenderRole} from "@/lib/types";

export default function QueuePage() {
  const router = useRouter();
  const [canConnect, setCanConnect] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
    } else {
      setCanConnect(true);
    }
  }, [router]);

  const {
    status,
    readyState,
    matchId,
    role,
    windowT,
    matchedGameId,
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
  } = useMatch(canConnect);

  const [timer, setTimer] = useState<number>(0);
  useEffect(() => {
    if (status === "found") {
      setTimer(windowT);
      const iv = setInterval(() => {
        setTimer((t) => Math.max(t - 1, 0));
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [status, windowT]);


  useEffect(() => {
    if (matchedGameId && role) {
      const normalizeRole = (r: string): SenderRole => {
        if (r === "W") return SenderRole.H;
        if (r === "I" || r === "A" || r === "H") return r as SenderRole;
        throw new Error(`未知角色: ${r}`);
      };
      const normalizedRole = normalizeRole(role);
      router.push(`/rooms/${matchedGameId}/${normalizedRole}`);
    }
  }, [matchedGameId, role, router]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      joinQueue?.();
    }
    return () => {
      if (readyState === ReadyState.OPEN) {
        leaveQueue?.();
      }
    };
  }, [readyState]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f0f0f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        px: 4,
      }}
    >
      <Typography
        variant="h2"
        fontFamily="monospace"
        fontWeight="bold"
        sx={{ mb: 4 }}
      >
        MATCH QUEUE
      </Typography>

      {status === "waiting" && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <span style={{ color: "#fdd835" }}>Finding an opponent...</span>
          </Typography>
          <Typography maxWidth="sm">
            Searching for a partner to begin your Turing Test session. You may
            be assigned as a <span style={{ color: "#03a9f4" }}>Judge</span> or a{" "}
            <span style={{ color: "#ffc107" }}>Witness</span> — stay sharp and
            get ready to play your part.
          </Typography>
        </>
      )}

      {status === "idle" && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 4 }}
          onClick={joinQueue}
        >
          Start Matching
        </Button>
      )}

      <MatchDialog
        open={status === "found"}
        matchId={matchId!}
        role={role!}
        windowT={windowT}
        acceptAction={acceptMatch}
        declineAction={declineMatch}
        timeoutAction={() => setSnackbar("对方已拒绝或超时，匹配失败")}
        remainingTime={timer}
      />

      <Snackbar
        open={!!snackbar}
        message={snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
      />

    </Box>
  );
}
