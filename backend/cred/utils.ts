function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Initialize a matrix to store distances
    const matrix: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Initialize the matrix with the distances from the empty string
    for (let i = 0; i <= m; i++) {
        matrix[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
        matrix[0][j] = j;
    }

    // Fill in the matrix with the minimum distances
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // Deletion
                matrix[i][j - 1] + 1,      // Insertion
                matrix[i - 1][j - 1] + cost  // Substitution
            );
        }
    }

    // The bottom-right cell contains the Levenshtein distance
    return matrix[m][n];
}

function isPasswordSimilar(newPassword: string, oldPassword: string, similarityThreshold: number = 3): boolean {
    const distance = levenshteinDistance(newPassword, oldPassword);
    return distance <= similarityThreshold;
}

export default {
    isPasswordSimilar
};