export const redirections = ({ router, moreInfo, redirect = [], toast }: any) => {
  if (router?.query?.end) {
    router.push(`${router?.query?.end}`)
    toast("success", `Inicio sesión con exito`)
  } else {
    if (router?.query?.d == "info-empresa" && moreInfo.role.includes("empresa")) {
      const path = window.origin.includes("://test.") ? process.env.NEXT_PUBLIC_CMS?.replace("//", "//test") : process.env.NEXT_PUBLIC_CMS
      router.push(path ?? "")
      toast("success", `Cuenta de empresa creada con exito`)
    }
    if (router?.query?.d == "info-empresa" && !moreInfo.role.includes("empresa")) {
      router.push("/info-empresa")
      toast("warning", `Inicio sesión con una cuenta que no es de empresa`)
    }
    if (router?.query?.d !== "info-empresa") {
      router.push(redirect ? redirect : "/")
      toast("success", `Cuenta creada con exito`)
    }
  }
}