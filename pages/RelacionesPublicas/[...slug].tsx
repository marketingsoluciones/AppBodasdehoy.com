import { useRouter } from "next/router";

const Slug = (params) => {
  return (
    <div className="w-[100%] h-[100%] items-center justify-center">
      <div id="rootElement" />
      hola
    </div>
  );
};

export default Slug;

export async function getServerSideProps({ params }) {
  return {
    props: params,
  };
}