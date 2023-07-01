import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Input,
  TextField,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { GET_ALL_PROFILES } from "../../queries/getAllProfiles";
import debounce from "lodash/debounce";
import styled from "@emotion/styled";
import ProfileGridItem from "./ProfileGridItem";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CreateProfile from "../CreateProfile/CreateProfile";
import SearchAndCreateProfile from "./SearchAndCreateProfile";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  image_url: string;
  description: string;
};

const Test = () => {
  const [searchString, setSearchString] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [doneLoad, setDoneLoad] = useState(0);
  const [shouldReload, setShouldReload] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [open, setOpen] = useState(false);
  const pageSize = 16;
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const muiTheme = createTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const { loading, error, data } = useQuery(GET_ALL_PROFILES, {
    variables: {
      page: currentPage,
      rows: pageSize,
      searchString: searchString,
    },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data && data.getAllProfiles) {
      const newProfiles = data.getAllProfiles.profiles;
      console.log("Total Profiles: " + data.getAllProfiles.size);

      setProfiles((prevProfiles) => [...prevProfiles, ...newProfiles]);
      setDoneLoad((prevDoneLoad) => prevDoneLoad + newProfiles.length);
      loadingMoreRef.current = false;
    }
  }, [data, setShouldReload]);

  const observer = useRef<IntersectionObserver | null>(null);

  const handleObserver = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      threshold: 0.5,
    });

    if (containerRef.current) {
      observer.current.observe(containerRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        containerRef.current &&
        window.innerHeight + window.scrollY >=
          containerRef.current.offsetTop + containerRef.current.offsetHeight
      ) {
        loadingMoreRef.current = true;
        setCurrentPage((prevPage) => prevPage + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      loadingMoreRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    setProfiles([]);
    setDoneLoad(0);
    setCurrentPage(0);
    loadingMoreRef.current = false;
  }, [searchString]);

  const debouncedSearch = useRef(
    debounce((value: string) => {
      setSearchString(value);
      if (value === "") {
        setShouldReload(true);
      } else setShouldReload(false);
    }, 700)
  ).current;
  useEffect(() => {
    if (shouldReload) {
      window.location.reload();
    }
  }, [shouldReload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);

    // Set the flag to reload the page if input is empty
  };

  if (error) {
    return <p>Error: {error.message}</p>;
  }
  return (
    <Box sx={{ maxWidth: "1300px", margin: "30px auto" }}>
      <SearchAndCreateProfile
        searchInput={searchInput}
        handleInputChange={handleInputChange}
        handleOpen={handleOpen}
        open={open}
        handleClose={handleClose}
      />

      {loading && !profiles.length ? (
        <p>Loading...</p>
      ) : (
        <div ref={containerRef}>
          <Grid
            container
            sx={{
              boxShadow: "none",
            }}>
            {profiles.map((profile) => (
              <ProfileGridItem key={profile.id} profile={profile} />
            ))}
          </Grid>
        </div>
      )}
    </Box>
  );
};

export default Test;
