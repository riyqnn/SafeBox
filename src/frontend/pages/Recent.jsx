import FileList from '../layouts/FileList';

function Recent({ setModalIsOpen }) {
  return (
    <FileList 
      title="Recent Uploads"
      apiUrl="/files"
      setModalIsOpen={setModalIsOpen}
    />
  );
}

export default Recent;