import { deleteObject, FirebaseStorage, getBytes, getMetadata, list, listAll, ref, } from "firebase/storage";

export const deleteRecursive = async (storage: FirebaseStorage, path: string) => {
    try {
        const pathRef = ref(storage, path);
        const listPage = await list(pathRef, { maxResults: 100 })
        const deletePromises = listPage.prefixes.map(async (prefix) => {
            await deleteAllFiles(storage, prefix.fullPath)
            await deleteRecursive(storage, prefix.fullPath)
        });
        await Promise.all(deletePromises);
    } catch (error) {
        console.log(error)
        throw await error
    }
};

export const deleteAllFiles = async (storage: FirebaseStorage, path: string) => {
    try {
        const storageFolderRef = ref(storage, path);
        const listAllFiles = await listAll(storageFolderRef)
        const deletePromises = listAllFiles.items.map(async (itemRef) => {
            await deleteObject(itemRef);
        });
        await Promise.all(deletePromises);
    } catch (error) {
        console.log(error)
        throw await error
    }
};

export const downloadFile = async (storage: FirebaseStorage, path: string) => {
    try {
        const storageRef = ref(storage, path)
        const metaData = await getMetadata(storageRef)
        getBytes(storageRef).then(buffer => {
            const blob = new Blob([buffer], { type: metaData.contentType })
            const file = new File([blob], metaData.name, { type: metaData.contentType })
            const url = window.URL.createObjectURL(file)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', metaData.name)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        })
    } catch (error) {
        console.log(error)
        throw error
    }
}
