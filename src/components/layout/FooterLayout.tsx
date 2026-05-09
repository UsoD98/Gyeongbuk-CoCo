export const Footer = () => {
  return (
    <>
      <footer className="footer-center footer bg-base-300 p-4 text-base-content sm:footer-horizontal">
        <aside>
          <p>
            Copyright © {new Date().getFullYear()} - All right reserved by ACME
            Industries Ltd
          </p>
        </aside>
      </footer>
    </>
  );
};
