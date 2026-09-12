export default function ProfilePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">
        Student Profile
      </h1>

      <div className="mt-6 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          Student Information
        </h2>

        <div className="mt-4 space-y-2">
          <p>
            <strong>Name:</strong> Student Name
          </p>

          <p>
            <strong>Email:</strong> student@example.com
          </p>

          <p>
            <strong>Student ID:</strong> 12345
          </p>

          <p>
            <strong>Branch:</strong> Computer Science
          </p>

          <p>
            <strong>Year:</strong> 2nd Year
          </p>
        </div>
      </div>
    </main>
  )
}
