import React, { useEffect, useMemo, useState, createContext } from 'react';
import PropTypes from "prop-types";
import axios from "axios";

import setHeaderToken from "./SetHeaderToken";

export const AuthContext = createContext<{
        isAuthenticated: boolean | null;
        setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
        user: null;
        setUser: React.Dispatch<React.SetStateAction<null>>;
    }>({
        isAuthenticated: null,
        setIsAuthenticated: () => {},
        user: null,
        setUser: () => {},
});

export default function AuthContextProvider({ children } : { children : any}) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState(null);

    const loadAuthUser = () => {
        const JWTToken = localStorage.getItem("JWTToken");

        if (!JWTToken) {
            setIsAuthenticated(false);
            return;
        }

        axios.get("/auth/whoami", setHeaderToken())
            .then((res : any) => {
                setUser(res.data);
                setIsAuthenticated(true);
            }).catch(() => {
                setIsAuthenticated(false);
            });
    }

    const providerValue = useMemo(() => {
        return {
            isAuthenticated,
            setIsAuthenticated,
            user,
            setUser
        }
    }, [isAuthenticated, setIsAuthenticated, user, setUser]);

    useEffect(() => {
        loadAuthUser();
    }, [user, isAuthenticated]);

    return (
        <AuthContext.Provider value={providerValue}>
            {children}
        </AuthContext.Provider>
    )
}

AuthContextProvider.propTypes = {
    children: PropTypes.node
}
