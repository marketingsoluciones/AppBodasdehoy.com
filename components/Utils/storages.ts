import { deleteObject, FirebaseStorage, list, listAll, ref } from "firebase/storage";

export const deleteRecursive = async (storage: FirebaseStorage, path: string) => {
    const pathRef = ref(storage, path);
    const listPage = await list(pathRef, { maxResults: 100 })
    const deletePromises = listPage.prefixes.map(async (prefix) => {
        await deleteAllFiles(storage, prefix.fullPath)
        await deleteRecursive(storage, prefix.fullPath)
    });
    await Promise.all(deletePromises);
};

export const deleteAllFiles = async (storage: FirebaseStorage, path: string) => {
    const storageFolderRef = ref(storage, path);
    const listAllFiles = await listAll(storageFolderRef)
    const deletePromises = listAllFiles.items.map(async (itemRef) => {
        await deleteObject(itemRef);
    });
    await Promise.all(deletePromises);
};
