namespace api.Services;

public interface INostrChallengeStore
{
    string Generate();
    bool ValidateAndConsume(string challenge);
}
