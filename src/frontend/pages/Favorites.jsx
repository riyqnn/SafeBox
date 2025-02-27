import FileList from '../layouts/FileList';

function Favourite({ setModalIsOpen }) {
  return (
    <FileList 
      title="Favorites"
      apiUrl="/files?favorite=true" // Add query parameter to fetch only favorites
      setModalIsOpen={setModalIsOpen}
    />
  );
}

export default Favourite;