import { InstagramProvider } from "./provider.interface";
import { InstagramGraphApiProvider } from "./graph-api.provider";
import { ApifyInstagramProvider } from "./apify.provider";

export function getInstagramProvider(): InstagramProvider {
  const providerType = (process.env.INSTAGRAM_PROVIDER || "graph_api").toLowerCase();

  if (providerType === "apify") {
    return new ApifyInstagramProvider();
  }

  return new InstagramGraphApiProvider();
}
