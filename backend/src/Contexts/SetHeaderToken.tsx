function setHeaderToken() {
    const JWTToken = localStorage.getItem("JWTToken");

    // If no token return empty object
    if (!JWTToken) {
        return {};
    }

    return {
        headers: {
            authorization: `Bearer ${JWTToken}`
        }
    }
}

export default setHeaderToken;
