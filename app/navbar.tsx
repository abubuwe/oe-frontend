'use client';

import { Container, Button, Typography, AppBar, Toolbar } from '@mui/material';
import { styled } from '@mui/system';
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Box,
  Divider,
} from "@mui/material";
const FixedAppBar = styled(AppBar)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
});

export function Navbar() {
  const { data: session } = useSession();
  return (
    <FixedAppBar position="static">
    <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h6" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, marginRight: '1.5rem', color: 'white' }}>
            Simple Ask
          </Typography>
          {/* Left-hand links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Link
              href="/dashboard"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              Dashboard
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            href="/new"
            variant="outlined"
            sx={{
              mr: 2,
              color: "#fff",
              borderColor: "#fff",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.8)",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            New Conversation
          </Button>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 1, bgcolor: "rgba(255,255,255,0.5)" }}
          />

          {/* Right-hand auth controls */}
          {session ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontWeight: 500, color: "#fff" }}>
                {session.user?.name || session.user?.email || "User"}
              </Typography>
              <Button
                onClick={() => signOut()}
                variant="outlined"
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Sign Out
              </Button>
            </Box>
          ) : (
            <Button
              onClick={() => signIn()}
              variant="contained"
              sx={{
                backgroundColor: "#fff",
                color: "#1976d2",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
              }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
    </Container>
    </FixedAppBar>
  );
}
