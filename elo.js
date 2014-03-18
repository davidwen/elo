K = 30;

calculateEloDiffs = function(ratingWinner, ratingLoser) {
    var expected = expectedScores(ratingWinner, ratingLoser);
    var expectedWinner = expected[0];
    var expectedLoser = expected[1];
    return [Math.round(K * (1.0 - expectedWinner)), Math.round(K * (0.0 - expectedLoser))]
};

var expectedScores = function(ratingA, ratingB) {
    var qA = Math.pow(10, ratingA / 400.0);
    var qB = Math.pow(10, ratingB / 400.0);
    return [qA / (qA + qB), qB / (qA + qB)];
};