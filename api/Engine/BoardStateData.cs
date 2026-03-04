using System.Text.Json;

namespace api.Engine;

/// <summary>
/// Serializable board state stored as JSON in Game.BoardState.
/// Cells[row][col]: 0=empty, 1=black man, 2=white man, 3=black king, 4=white king.
/// PendingCapture* tracks a piece mid-multi-capture (-1 if none).
/// </summary>
public class BoardStateData
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public int[][] Cells { get; set; } = [];
    public int PendingCaptureRow { get; set; } = -1;
    public int PendingCaptureCol { get; set; } = -1;

    public bool HasPendingCapture => PendingCaptureRow >= 0;

    public string Serialize() => JsonSerializer.Serialize(this, JsonOpts);

    public static BoardStateData Deserialize(string json) =>
        JsonSerializer.Deserialize<BoardStateData>(json, JsonOpts)!;
}
