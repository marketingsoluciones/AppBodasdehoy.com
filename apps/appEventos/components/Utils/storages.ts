/**
 * Firebase Storage — Adjuntos de tareas y comentarios en appEventos
 *
 * Este módulo gestiona archivos subidos directamente a Firebase Storage
 * (adjuntos de tareas del itinerario y archivos en comentarios).
 * Firebase Storage NO se reemplaza con R2 — son sistemas distintos:
 *
 *   Firebase Storage → Adjuntos de tareas / comentarios de appEventos
 *                      (acceso controlado por las reglas de Firebase Auth)
 *   Cloudflare R2    → Álbumes de fotos (memories), archivos del chat-ia
 *                      (acceso gestionado por api-ia + whitelabel)
 *
 * Estructura de carpetas en Firebase:
 *   Tareas simples:  {taskId}//{filename}
 *   Comentarios:     event-{eventId}//itinerary-{itineraryId}//task-{taskId}//comment-{commentId}//{filename}
 *
 * Los archivos ya subidos a Firebase siguen siendo accesibles para los usuarios.
 * No hay migración pendiente — estos flujos continúan en Firebase.
 */
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
    const storageRef = ref(storage, path)
    const metaData = await getMetadata(storageRef)
    const buffer = await getBytes(storageRef)
    const blob = new Blob([buffer], { type: metaData.contentType })
    const file = new File([blob], metaData.name, { type: metaData.contentType })
    const url = window.URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', metaData.name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
