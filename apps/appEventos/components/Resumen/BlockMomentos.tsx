import { useRouter } from "next/navigation";
import { BsImages } from "react-icons/bs";
import { EventContextProvider } from "../../context";

export function BlockMomentos() {
  const router = useRouter();
  const { event } = EventContextProvider();

  const albumCount: number = (event as any)?.memoriesAlbumCount ?? 0;
  const mediaCount: number = (event as any)?.memoriesMediaCount ?? 0;

  return (
    <div
      onClick={() => router.push("/momentos")}
      className="cursor-pointer bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <BsImages className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-gray-800 text-lg">Momentos</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">Ver todo →</span>
      </div>

      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{albumCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">álbumes</p>
        </div>
        {mediaCount > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{mediaCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">fotos</p>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Álbumes de fotos compartidos con tus invitados.
      </p>
    </div>
  );
}
