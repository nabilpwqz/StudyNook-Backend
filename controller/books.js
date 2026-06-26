const booksController = {};
const { BookModel } = require("../model/BookModel");
const {BorrowModel} = require("../model/BorrowModel")
const cloudinary = require("cloudinary").v2;
const calculateFine = require("../utils/fineCalculator")
const { clearCache } = require("../utils/cache");


booksController.addNewBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      isbn,
      availableCopies,
      totalCopies,
      coverImage,
      price,
      description,
      floor,
      capacity,
      hourlyRate,
      amenities,
    } = req.body;
    const { id } = req.userInfo;

    if (!title || !description) {
      return res.status(400).json({ error: true, message: "Title and description are required" });
    }

    const existingBook = isbn ? await BookModel.findOne({ isbn }) : null;
    if (existingBook) {
      return res.status(400).json({ error: true, message: "Book with this ISBN already exists" });
    }

    const coverImageUrl = req.file ? req.file.path : coverImage || "";
    const cloudinaryId = req.file ? req.file.filename : "";
    const amenityList = typeof amenities === "string"
      ? amenities.split(",").map((item) => item.trim()).filter(Boolean)
      : Array.isArray(amenities)
        ? amenities
        : [];

    const newBook = new BookModel({
      title,
      author,
      category,
      isbn,
      availableCopies: totalCopies || availableCopies || 0,
      totalCopies: totalCopies || availableCopies || 0,
      addedBy: id,
      owner: id,
      coverImage: coverImageUrl,
      cloudinaryId,
      price: price || 0,
      description,
      floor: floor || "",
      capacity: Number(capacity) || 1,
      hourlyRate: Number(hourlyRate) || 0,
      amenities: amenityList,
    });

    await newBook.save();
    clearCache("homeData");
    res.status(201).json({ error: false, message: "Room added successfully", book: newBook });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error", error });
  }
};

booksController.getAllBooks = async (req, res) => {
  try {
    const { search, amenities, minRate, maxRate, floor } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map((value) => value.trim()).filter(Boolean);
      if (amenitiesArray.length) {
        query.amenities = { $all: amenitiesArray };
      }
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }

    if (floor) {
      query.floor = { $regex: floor, $options: "i" };
    }

    const books = await BookModel.find(query).populate("owner", "name photoURL").sort({ createdAt: -1 });
    const totalBooks = books.length;

    if (!books || books.length === 0) {
      return res.status(200).json({ error: true, message: "No rooms found", books: [], totalBooks });
    }

    res.status(200).json({ error: false, message: "Rooms fetched successfully", books, totalBooks });
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};

booksController.getMyListings = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const listings = await BookModel.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json({ error: false, message: "My listings fetched successfully", listings });
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};


booksController.getIssuedRequest = async (req, res) => {
  try {
    const requestedBooks = await BorrowModel.find({ status: 'Requested' });
    const totalRequestedBooks = requestedBooks.length;
    if(!requestedBooks || requestedBooks.length === 0){
      return res.json({error:true,message:"No Books Found"});
    }


    res.status(200).json({error:false,message:"Books fetched Successfully",requestedBooks,totalRequestedBooks});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error",
      details: error.message, });
  }
};

booksController.getLatestBooks = async (req, res) => {
  try {
    const books = await BookModel.find().populate("addedBy", "name email role").sort({ createdAt: -1 }) ;
    console.log(books);
    const totalBooks = books.length;
    if(!books || books.length === 0){
      return res.json({error:true,message:"No Books Found"});
    }

    const uniqueCategories = new Set(books.map(book => book.category)); // Assuming the 'category' field in each book
    const totalCategories = uniqueCategories.size;

    const bookIds = books.map(book => book._id);

    // Fetch the issues related to these books
    const issuedBooks = await BorrowModel.find({
      bookId: { $in: bookIds },
      status: 'Issued',  // Only consider issued books
    }).populate('userId'); // Populate student details from the 'Student' collection

    // Get the unique active students from the issued books
    const activeStudents = new Set(issuedBooks.map(issue => issue.userId._id.toString()));
    const totalActiveStudents = activeStudents.size;



    res.status(200).json({error:false,message:"Books fetched Successfully",books,totalBooks,totalCategories,totalActiveStudents});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error",
      details: error.message, });
  }
};


booksController.getParticularBook = async (req, res) => {
  try {
    const id = req.params.id;
    const book = await BookModel.findById(id).populate(
      "addedBy",
      "name email role"
    );
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "internal server error", error });
  }
};

booksController.updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      isbn,
      availableCopies,
      totalCopies,
      addedBy,
      coverImage,
      price,
    } = req.body;

    const bookUpdate = await BookModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        category,
        availableCopies,
        totalCopies,
        // coverImage,
        price,
      },
      { new: true }
    );
    if (!bookUpdate) {
      return res.status(404).json({ message: "Book not found" });
    }
    clearCache("homeData");
    res
      .status(200)
      .json({ message: "Book updated successfully", book: bookUpdate });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

booksController.deleteBook = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: true, message: "Book not found" });
    if (book.cloudinaryId) {
      await cloudinary.uploader.destroy(book.cloudinaryId);
    }
    await BookModel.findByIdAndDelete(req.params.id);
    clearCache("homeData");
    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    // console.log(deletedBook)
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

booksController.issueBook = async(req,res)=>{
  try {
    const {bookid} = req.params;
  const userid = req.userInfo.id;
  const book = await BookModel.findById(bookid);
  if (!book) return res.status(404).json({ message: "Book not found!" });

  const issuedBooksCount = await BorrowModel.countDocuments({ userId: userid, status: "Issued" });
  console.log("issuedBooksCount");
  console.log(issuedBooksCount);

  if (issuedBooksCount >= 4) {
    return res.status(400).json({ message: "You can issue a maximum of 4 books at a time." });
  }

  if(book.totalCopies <= 0){
    return res.status(400).json({ message: "No copies available to issue!" });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const borrow = new BorrowModel({
    bookId:bookid,
    userId:userid,
    issueDate: new Date(),
    dueDate,
    returnDate: null,
    fineAmount:0,
     status: "Issued"
  })

  await borrow.save();

  book.availableCopies-=1
  await book.save();

  res.status(200).json({ message: "Book issued successfully!", dueDate });
    
  } catch (error) {
    console.error("Error issuing book:", error);
    res.status(500).json({ message: "Internal server error" });    
  }
}

booksController.reqIssueBook = async (req, res) => {
  try {
    const userid = req.userInfo.id;
    const { bookid } = req.params;

    // Check if book exists
    const book = await BookModel.findById(bookid);
    if (!book) {
      return res.status(404).json({ error: true, message: "Book not found" });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ error: true, message: "No available copies to issue" });
    }

    // Check if user already has 4 books that are either issued, requested, or requested for return
    const currentCount = await BorrowModel.countDocuments({
      userId: userid,
      status: { $in: ["Requested", "Issued", "Requested Return"] }
    });

    if (currentCount >= 4) {
      return res.status(400).json({ error: true, message: "You cannot request or issue more than 4 books at a time, including books pending return approval." });
    }

    // Check if this specific book is already requested/issued by the user
    const existingRequest = await BorrowModel.findOne({
      userId: userid,
      bookId: bookid,
      status: { $in: ["Requested", "Issued"] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: true, message: "You already requested or issued this book" });
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const newBorrow = new BorrowModel({
      bookId: bookid,
      userId: userid,
      issueDate: today,
      dueDate,
      status: "Requested",
    });

    await newBorrow.save();

    res.status(200).json({
      error: false,
      message: "Book request submitted. Wait for librarian approval.",
      borrow: newBorrow
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// booksController.getIssuedBooks = async (req, res) => {
//   try {
//     const userId = req.userInfo.id; 
//     console.log("Fetching issued books for user:", userId);

//     const issuedBooks = await BorrowModel.find({ userId, returnDate: null }) 
//       .populate("bookId", "title author category isbn price coverImage")
//       .populate("userId", "name email role"); 

//     if (!issuedBooks || issuedBooks.length === 0) {
//       return res.status(404).json({ error: true, message: "No issued books found." });
//     }

//     res.json({ error: false, message: "Issued books fetched successfully", issuedBooks });
//   } catch (error) {
//     console.error("Error fetching issued books:", error);
//     res.status(500).json({ error: true, message: "Internal server error" });
//   }
// };

booksController.getIssuedBooks = async (req, res) => {
  try {
    const userId = req.userInfo.id;

    const issuedBooks = await BorrowModel.find({
      userId,
      returnDate: null,
      status: { $in: ["Issued", "Requested", "Requested Return"] }
    })
      .populate("bookId", "title author category isbn price coverImage")
      .populate("userId", "name email role")
      .sort({ issueDate: -1 });

    if (!issuedBooks || issuedBooks.length === 0) {
      return res.status(200).json({
        error: true,
        message: "No issued books found.",
        issuedBooks: []
      });
    }

    const booksWithFine = issuedBooks.map(book => {
      const fine = calculateFine(book.dueDate, book.returnDate); // returnDate may be null
      return { ...book.toObject(), fine };
    });

    res.json({
      error: false,
      message: "Issued books fetched successfully",
      issuedBooks: booksWithFine
    });

  } catch (error) {
    console.error("Error fetching issued books:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

booksController.returnBook = async (req, res) => {
  try {
  const issueId = req.params.id;
  console.log("issueId")
  console.log(issueId)

  // Find issued book entry
  const issuedBook = await BorrowModel.findById(issueId);
  if (!issuedBook) {
      return res.status(404).json({ message: "Issued record not found" });
  }

  if (issuedBook.status === "Returned") {
      return res.status(400).json({ message: "Book already returned" });
  }

  // Update status and set return date
  issuedBook.status = "Returned";
  issuedBook.returnDate = new Date();
  await issuedBook.save();

  // Increment available copies in the Book model
  await BookModel.findByIdAndUpdate(issuedBook.bookId, {
      $inc: { availableCopies: 1 }  // Increase available copies by 1
  });

  res.json({ message: "Book returned successfully", issuedBook });
} catch (error) {
  console.error("Error returning book:", error);
  res.status(500).json({ message: "Server error" });
}
};

booksController.requestReturnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;

    const borrowRecord = await BorrowModel.findById(borrowId);
    if (!borrowRecord) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // Check if the book belongs to the logged-in user
    if (borrowRecord.userId.toString() !== req.userInfo.id.toString()) {
      return res.status(403).json({ message: "Unauthorized to request return for this book" });
    }

    // Check if status is 'Issued'
    if (borrowRecord.status !== "Issued") {
      return res.status(400).json({ message: "Only books with status 'Issued' can be requested for return" });
    }

    // Update status to "Requested Return"
    borrowRecord.status = "Requested Return";
    await borrowRecord.save();

    return res.status(200).json({ message: "Return request submitted successfully" });

  } catch (error) {
    console.error("Error in return request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { booksController };

// status:"Issued"