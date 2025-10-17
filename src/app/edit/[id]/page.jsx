import EditLoader from "./EditLoader";

export default async function EditPage(props) {
  const { id } = await props.params;
  return <EditLoader id={id} />;
}
