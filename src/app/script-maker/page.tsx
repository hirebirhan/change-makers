import { getYouTubeData } from "@/lib/youtube-server";
import { ScriptMakerView } from "@/components/ScriptMakerView";

export const revalidate = 300;
export const metadata = { title: "Script Maker" };

export default async function ScriptMakerPage() {
  const data = await getYouTubeData();
  return <ScriptMakerView initialData={data} />;
}
