using lnd_gateway.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace tests.Controllers;

[TestClass]
public class HealthControllerTests
{
    private HealthController _controller = null!;

    [TestInitialize]
    public void Init() => _controller = new HealthController();

    [TestMethod]
    public void Get_Returns200()
    {
        var result = _controller.Get();

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public void Get_ReturnsStatusOk()
    {
        var result = _controller.Get() as OkObjectResult;

        Assert.IsNotNull(result);
        Assert.IsNotNull(result.Value);
        Assert.AreEqual(200, result.StatusCode);
    }
}
